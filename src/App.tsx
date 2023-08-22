import bg from './assets/bg.png';
import SignIn from './components/SignIn/SignIn.component';

function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div
        className="h-full w-full"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <SignIn />
      </div>
    </div>
  );
}

export default App;
