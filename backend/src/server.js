require('dotenv').config();
const express = require('express');
const path = require('path');
const {
  createHash,
  randomBytes,
  scrypt: scryptCallback,
  timingSafeEqual
} = require('crypto');
const { promisify } = require('util');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT) || 3000;
const scrypt = promisify(scryptCallback);
const sessionCookie = 'fh_session';
const sessionDurationMs = 30 * 24 * 60 * 60 * 1000;
const passwordKeyLength = 64;

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));

function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function readSessionToken(request) {
  const cookie = request.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookie}=`));
  return cookie ? cookie.slice(sessionCookie.length + 1) : null;
}

function setSessionCookie(response, token, maxAgeSeconds) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader(
    'Set-Cookie',
    `${sessionCookie}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}${secure}`
  );
}

async function createSession(userId, response) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + sessionDurationMs);
  await prisma.authSession.create({
    data: { tokenHash: hashSessionToken(token), userId, expiresAt }
  });
  setSessionCookie(response, token, sessionDurationMs / 1000);
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, passwordKeyLength, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt}$${hash.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  const [algorithm, salt, storedKey] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !salt || !/^[a-f0-9]{128}$/i.test(storedKey || '')) {
    return false;
  }
  const derivedKey = await scrypt(password, salt, passwordKeyLength, { N: 16384, r: 8, p: 1 });
  return timingSafeEqual(derivedKey, Buffer.from(storedKey, 'hex'));
}

async function findSession(request) {
  const token = readSessionToken(request);
  if (!token) return null;
  const session = await prisma.authSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } }
  });
  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await prisma.authSession.delete({ where: { id: session.id } });
    return null;
  }
  return session;
}

app.get('/api/health', async (request, response, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/register', async (request, response, next) => {
  try {
    const body = request.body || {};
    const email = typeof body.email === 'string'
      ? body.email.trim().toLowerCase()
      : '';
    const password = typeof body.password === 'string'
      ? body.password
      : '';
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return response.status(400).json({ error: 'Enter a valid email address.' });
    }
    if (!firstName || firstName.length > 80 || !lastName || lastName.length > 80) {
      return response.status(400).json({ error: 'Enter a first and last name, each 80 characters or fewer.' });
    }
    if (password.length < 8 || password.length > 128) {
      return response.status(400).json({ error: 'Password must be between 8 and 128 characters.' });
    }

    const user = await prisma.user.create({
      data: { email, firstName, lastName, passwordHash: await hashPassword(password) },
      select: { id: true, email: true, firstName: true, lastName: true }
    }).catch((error) => {
      if (error.code === 'P2002') return null;
      throw error;
    });
    if (!user) {
      return response.status(409).json({ error: 'An account with that email already exists. Sign in instead.' });
    }

    await createSession(user.id, response);
    response.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (request, response, next) => {
  try {
    const body = request.body || {};
    const email = typeof body.email === 'string'
      ? body.email.trim().toLowerCase()
      : '';
    const password = typeof body.password === 'string'
      ? body.password
      : '';
    if (email.length > 254 || password.length > 128 || !password) {
      return response.status(401).json({ error: 'Email or password is incorrect.' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return response.status(401).json({ error: 'Email or password is incorrect.' });
    }

    await createSession(user.id, response);
    response.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/me', async (request, response, next) => {
  try {
    const session = await findSession(request);
    response.json({ user: session ? session.user : null });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/logout', async (request, response, next) => {
  try {
    const token = readSessionToken(request);
    if (token) {
      await prisma.authSession.deleteMany({
        where: { tokenHash: hashSessionToken(token) }
      });
    }
    setSessionCookie(response, '', 0);
    response.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/settings', (request, response) => {
  response.json({
    whatsappPhone: (process.env.WHATSAPP_PHONE || '').replace(/\D/g, '')
  });
});

app.get('/api/categories', async (request, response, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { products: { some: { active: true } } },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true }
    });
    response.json(categories);
  } catch (error) {
    next(error);
  }
});

app.get('/api/products', async (request, response, next) => {
  try {
    const search = typeof request.query.search === 'string'
      ? request.query.search.trim().slice(0, 100)
      : '';
    const category = typeof request.query.category === 'string'
      ? request.query.category.trim().slice(0, 80)
      : '';
    const products = await prisma.product.findMany({
      where: {
        active: true,
        ...(category ? { category: { name: category } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { color: { contains: search, mode: 'insensitive' } },
                { material: { contains: search, mode: 'insensitive' } }
              ]
            }
          : {})
      },
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        price: true,
        originalPrice: true,
        rating: true,
        stock: true,
        color: true,
        material: true,
        image: true,
        images: true,
        tags: true,
        newArrival: true,
        featured: true,
        category: { select: { name: true } }
      }
    });

    response.json(products.map(({ category: productCategory, ...product }) => ({
      ...product,
      category: productCategory.name
    })));
  } catch (error) {
    next(error);
  }
});

app.use(express.static(path.resolve(__dirname, '../..')));

app.use((error, request, response, next) => {
  console.error(error);
  if (response.headersSent) return next(error);
  response.status(500).json({ error: 'The server could not complete the request.' });
});

if (require.main === module) {
  const server = app.listen(port, () => {
    console.log(`Furniture Hub is available at http://localhost:${port}`);
  });

  async function shutdown() {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = app;
