import LeftSidebar from "./components/LeftSidebar";
import AuthForm from "./component/AuthFormsLogin"; 
import AuthFormSign from "./component/AuthFormsLogin";
import "./App.css";

function App() {
  return (
    <div className="app">
     


     
      <LeftSidebar />
      <AuthForm />
     
      <main className="main-content">
        <h1>UniConnect</h1>
      </main>
    </div>
  );
}

export default App;