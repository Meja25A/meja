# Furniture Hub

Furniture Hub is a frontend-only furniture storefront. The product catalog is
bundled in `catalog.js`; the site does not use a server, database, API, or
account system.

## Run locally

Open `index.html` in a browser, or serve this folder with a static file server
such as the VS Code Live Server extension. No build or package installation is
required.

To edit products, categories, or the WhatsApp contact number, update
`catalog.js`. Set `whatsappPhone` to the store's international phone number
without a leading plus sign. Leave it empty to disable WhatsApp ordering.

The catalog, search, filters, product details, and cart run in the browser.
Online checkout, account registration, and sign-in are not included; they
require a backend.

## Deploy to Netlify

Import the repository into Netlify from GitHub. Netlify uses the repository
root as the publish directory; no build command, database, or environment
variables are required. The included `netlify.toml` sets the publish directory.
