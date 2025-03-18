import { StrictMode } from 'react'
import * as ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './app/pages/app'
/*form fati12355*/
import React from 'react';
/*form fati12355*/

/*
ReactDOM.render(
<React.StrictMode>
<App/>
</React.StrictMode>,
document.getElementById('root')
);
*/
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
