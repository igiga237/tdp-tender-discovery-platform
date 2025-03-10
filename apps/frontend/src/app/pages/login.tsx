import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../component/AuthContext';
import { loginAPI, getaccountAPI } from '../../api';

type LoginFormData = {
  email: string;
  password: string;
};

const Login: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false); // Track login state

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setLoading(true); // Start loading
    try {
      // 1. Call your Node backend login endpoint (not Supabase directly)
      const res = await loginAPI(data.email, data.password);

      // 2. If the login was successful, store the custom JWT from res.data.token
      if (res.status === 200) {
        // This is the Node JWT returned by your Node backend
        localStorage.setItem('token', res.data.token);
        // We can also store user email or other data if you want
        localStorage.setItem('user_email', res.data.user.email);

        alert("Login Successful!");

        // 3. Re-fetch the user account so auth.context sees the newly recognized user
        try {
          const accountRes = await getaccountAPI();
          console.log("Response from /api/v1/auth/account after login:", accountRes);

          if (accountRes && accountRes.user) {
            setAuth({
              isAuthenticated: true,
              user: {
                email: accountRes.user.email,
                name: accountRes.user.name || accountRes.user.email,
              },
            });
          } else {
            console.warn("No user returned from getaccountAPI after login");
            setAuth({
              isAuthenticated: false,
              user: { email: "", name: "" },
            });
          }
        } catch (err) {
          console.error("Error fetching user account after login:", err);
          setAuth({
            isAuthenticated: false,
            user: { email: "", name: "" },
          });
        }

        // 4. Optional: redirect after a brief delay
        setTimeout(() => navigate('/'), 1000);
      }
      // Handle other statuses (403 for lockout, etc.)
      else if (res.status === 403) {
        alert("Too many failed login attempts. Try again later.");
      } else {
        alert("Login failed. Please check your credentials and try again.");
        console.error("Login failed", res);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        alert("Too many failed login attempts. Try again later.");
      } else {
        alert("An error occurred during login.");
        console.error("Login error", error);
      }
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ width: '300px', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Login</h2>

        {/* Email Input */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            {...register('email', { required: 'Email is required' })}
            placeholder="Enter your email"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          {errors.email && <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{errors.email.message}</p>}
        </div>

        {/* Password Input */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input
            type="password"
            {...register('password', { required: 'Password is required' })}
            placeholder="Enter your password"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          {errors.password && <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{errors.password.message}</p>}
        </div>

        {/* Login Button with Loading State */}
        <button
          type="submit"
          disabled={loading} // Disable button while loading
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: loading ? '#6c757d' : '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Forgot Password Link */}
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <Link to="/forgot-reset-password" style={{ textDecoration: 'underline', color: '#007bff' }}>
            Forgot Password?
          </Link>
        </div>

        {/* Sign Up Link */}
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <p style={{ margin: 0 }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ textDecoration: 'underline', color: '#007bff' }}>
              Sign up
            </Link>
          </p>
        </div>
      </form>
      <ToastContainer />
    </div>
  );
};

export default Login;

