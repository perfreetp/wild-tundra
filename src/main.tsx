import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// 不使用 React.StrictMode：它在开发模式下会双挂载组件，导致 WebGL 渲染器、
// TransformControls 与 store 订阅被创建两次，重型 three.js 场景无需双调用检测。
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
