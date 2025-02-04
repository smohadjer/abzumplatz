import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from "react-router";
import App from './App.tsx'
import store from './store'
import { Provider } from 'react-redux'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
     <BrowserRouter>
         <Provider store={store}>
            <App />
         </Provider>
     </BrowserRouter>
  </React.StrictMode>,
)
