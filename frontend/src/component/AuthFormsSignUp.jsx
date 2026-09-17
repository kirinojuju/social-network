import './AuthStyle.css';

export default function AuthFormSignUp() {
  return (
    <div className="card signup-card" id="signup">
      <h2>Welcome to CMU Connect</h2>
      
      <div className="form-row">
        <div className="form-group">
          <input type="text" placeholder="First Name" aria-label="First Name" />
        </div>
        <div className="form-group">
          <input type="text" placeholder="Last Name" aria-label="Last Name" />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <input type="email" placeholder="CMU Email" aria-label="CMU Email" />
        </div>
        <div className="form-group">
          <input type="text" placeholder="Student ID" aria-label="Student ID" />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <input type="password" placeholder="Password" aria-label="Password" />
        </div>
        <div className="form-group">
          <input type="password" placeholder="Confirm Password" aria-label="Confirm Password" />
        </div>
      </div>
      
      <span className="radio-label">Account Type</span>
      <div className="radio-group">
        <label className="radio-option">
          <input type="radio" name="account_type" value="professor" />
          Professor
        </label>
        <label className="radio-option">
          <input type="radio" name="account_type" value="student" />
          Student
        </label>
        <label className="radio-option">
          <input type="radio" name="account_type" value="staff" />
          Staff
        </label>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <input type="text" placeholder="Faculty" aria-label="Faculty" />
        </div>
        <div className="form-group">
          <input type="text" placeholder="Major" aria-label="Major" />
        </div>
      </div>
      
      <button className="btn btn-signup" type="button">
        Create Account
      </button>
      
      <div className="footer-text">
        Already have an account? <a href="#signin">Sign In</a>
      </div>
    </div>
  );
};


