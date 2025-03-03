import express from 'express';
import pkg from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';


dotenv.config();

const app = express();
app.use(cors({origin: '='}));
app.use(express.json({limit: '10mb'}));

const { Request, Response } = pkg;
//Loading the supabase URL and key and setting up the client
const supabaseURL: string | undefined = process.env.SUPABASE_URL;
const supabaseKEY: string | undefined = process.env.SUPABASE_SERVICE_KEY;
const supabaseClient = createClient(supabaseURL, supabaseKEY);

//Function that implements password validation
function matchPass(password: string): boolean {
  const pass = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
  return pass.test(password);
}


app.post('/api/v1/auth/signup', async (req: Request, res: Respond) => {
  // Reads and breaks down incoming requests from the body
  const { name, email, password, confirmPass } = req.body;

  // Make sure that all fields are filled in before moving forward
  if (!name || !email || !password || !confirmPass) {
    return res.status(400).json({ error: 'Name, Email, Password, and Confirm Password are required.' });
  }

  // Validate that the pass matches the confirm pass field
  if (password !== confirmPass) {
    return res.status(400).json({ error: 'The Password and Confirm Password fields do not match.' });
  }

  // Ensure that the password contains all the necessary requirements before proceeding
  if (!matchPass(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long, it must contain at least one uppercase letter, must have one number, and must contain one special character.' });
  }
  

  // Call the Supabase sign up authentication API
  const { data, error } = await supabaseClient.auth.signUp(
    { email, password },
    { data: { fullName: name } } 
  );
  // If the sign up does not proceed successfully, supabase sends out error
  if (error) {
    
    return res.status(400).json({ error: error.message });
  }

  // if the sign up should succeed, email verification will be sent by supabase and the client should be informed to check their email
  res.status(200).json({
    message: 'The sign up has completed successfully. Please proceed with the instructions in  your email to verify your account.',
    user: data.user
  });
});

app.get('/', (req: Request, res: Response) => {
  // The user is already verified by Supabase if the link was clicked                             
  console.log('User has clicked the link.  Supabase has verified them.');
  res.send('Your account has been verified! You can now close this tab or proceed to log in.');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`The server running on port ${PORT}`);
});
