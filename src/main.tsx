// import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router";
import App from './App.tsx'
import {store} from './store'
import { Provider } from 'react-redux'

const rootElement = document.getElementById('root')!;
const isPrerenderedHomepage = window.location.pathname === '/'
    && rootElement.hasChildNodes();
const app = (
    <BrowserRouter>
        <Provider store={store}>
            <App initiallyInitialized={isPrerenderedHomepage} />
        </Provider>
    </BrowserRouter>
);

if (isPrerenderedHomepage) {
    hydrateRoot(rootElement, app);
} else {
    createRoot(rootElement).render(app);
}
