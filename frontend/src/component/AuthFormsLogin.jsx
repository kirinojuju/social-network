import './AuthStyle.css';

export default function AuthFormLogin() {
  return (
    <div className="card signin-card" id="signin">
      <h2>Welcome Back</h2>
      
      <div className="signin-inner">
        <div className="form-group">
          <input type="email" placeholder="CMU Email" aria-label="CMU Email" />
        </div>
        <div className="form-group">
          <input type="password" placeholder="Password" aria-label="Password" />
        </div>
        
        <button className="btn" type="button" style={{ marginTop: '15px' }}>
          Login
        </button>
        
        <a href="#forgot" className="forgot-password">
          Forgot password?
        </a>
        
        <div className="divider">OR</div>
        
        <div className="footer-text" style={{ marginTop: 0 }}>
          Continue with <a href="#cmu-login">CMU</a>
        </div>
        <div className="footer-text">
          New to CMU Connect? <a href="#signup">Create an account</a>
        </div>
      </div>
    </div>
  );
};


