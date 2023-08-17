import { useState } from 'react';
import img from '../public/vite.svg';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <div className="mx-7 mb-10 mt-10 bg-red-500">
        <div className="ml-10 mt-10 bg-indigo-600">Test</div>
        <button type="button" onClick={() => setCount((countA) => countA + 1)}>
          count is {count}
        </button>
        <img alt="hey" src={img} />
      </div>
    </div>
  );
}

export default App;
