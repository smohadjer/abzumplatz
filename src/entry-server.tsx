import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { Provider } from 'react-redux';
import App from './App';
import { store } from './store';

export function renderHomepage() {
    return renderToString(
        <StaticRouter location="/">
            <Provider store={store}>
                <App initiallyInitialized />
            </Provider>
        </StaticRouter>
    );
}
