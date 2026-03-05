'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, animate, useMotionValue } from 'framer-motion';

function AnimatedInput({ 
  value, 
  onChange, 
  type = "text",
  placeholder,
  id,
  required = false,
  autoComplete
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  id: string;
  required?: boolean;
  autoComplete?: string;
}) {
  const displayValue = useMotionValue("");

  useEffect(() => {
    if (value.length > displayValue.get().length) {
      // When adding characters
      const animation = animate(displayValue.get().length, value.length, {
        duration: 0.1,
        ease: "linear",
        onUpdate: (latest) => {
          displayValue.set(value.slice(0, Math.ceil(latest)));
        },
      });
      return () => animation.stop();
    } else {
      // When deleting characters, update immediately
      displayValue.set(value);
    }
  }, [value, displayValue]);

  return (
    <div className="relative">
      <input
        type={type}
        id={id}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        className="mt-1 block w-full rounded-md bg-[#0f172a] border border-[#334155] px-3 py-2 text-white placeholder-gray-400 focus:border-[#00a0cb] focus:ring-[#00a0cb] focus:ring-opacity-50 relative z-10"
        placeholder={placeholder}
        style={{ color: 'white' }}
      />
      <div 
        className="absolute inset-0 px-3 py-2 text-white pointer-events-none flex items-center"
        style={{ fontFamily: "inherit" }}
      >
        {displayValue.get()}
        {value && (
          <motion.div
            className="inline-block w-[2px] h-[1.2em] bg-[#00a0cb] ml-[1px]"
            animate={{
              opacity: [1, 1, 0, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              times: [0, 0.5, 0.5, 1],
            }}
          />
        )}
      </div>
    </div>
  );
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  const getStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getStrength(password);
  const colors = ['#ff4444', '#ffbb33', '#00C851', '#007E33'];
  
  return (
    <div className="mt-1 space-y-2">
      <div className="flex gap-1">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="h-1 flex-1 rounded-full"
            initial={{ backgroundColor: '#334155' }}
            animate={{
              backgroundColor: i < strength ? colors[strength - 1] : '#334155',
              scale: i < strength ? [1, 1.2, 1] : 1,
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
      {password && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-gray-400"
        >
          {strength === 0 && "Too weak"}
          {strength === 1 && "Could be stronger"}
          {strength === 2 && "Getting better"}
          {strength === 3 && "Strong password"}
          {strength === 4 && "Excellent password!"}
        </motion.p>
      )}
    </div>
  );
}

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Signing in...');
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('Sign-in result:', result);
      
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }
      
      // If successful, manually redirect
      if (result?.ok) {
        console.log('Sign-in successful, redirecting...');
        
        // Check if there's a specific callbackUrl in the URL
        const searchParams = new URLSearchParams(window.location.search);
        const callbackUrl = searchParams.get('callbackUrl');
        
        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          // Default redirect to root, the middleware will handle the rest
          router.push('/');
        }
      } else {
        // Handle unexpected cases
        setError('An unexpected error occurred');
        setIsLoading(false);
      }
    } catch (error) {
      setError('An error occurred during sign in');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-[#190b37]"
        />
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#2f4faa_1px,transparent_1px),linear-gradient(to_bottom,#2f4faa_1px,transparent_1px)] bg-[size:4rem_4rem]"
          style={{ opacity: 0.15 }}
        />
      </div>
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center justify-center">
            <motion.div 
              className="w-64 h-64 mb-8 relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                duration: 0.8
              }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-[#00d4ff20] to-[#00a0cb20] rounded-full blur-2xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-conic from-[#00d4ff10] via-transparent to-[#00a0cb10] rounded-full"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <motion.img
                src="/SSlogo.svg"
                alt="ShadowAI Shield"
                className="w-full h-full relative z-10"
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ 
                  rotate: 0,
                  scale: 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                }}
                whileHover={{
                  scale: 1.05,
                  filter: "drop-shadow(0 0 20px #00d4ff50)",
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 15
                  }
                }}
              />
            </motion.div>
            
            <motion.h2
              className="text-3xl font-bold text-white text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Welcome Back
            </motion.h2>
            
            <motion.p
              className="mt-2 text-sm text-[#00a0cb] text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Sign in to your account
            </motion.p>
          </div>

          <motion.div
            className="mt-8 bg-[#1e293b] rounded-lg p-6 shadow-xl backdrop-blur-sm relative overflow-hidden"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.8,
              delay: 0.3,
              type: "spring",
              stiffness: 100,
              damping: 20
            }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-[#00d4ff05] to-transparent"
              animate={{
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-[#00d4ff05] to-[#00a0cb05]"
              animate={{
                opacity: [0.3, 0.5, 0.3],
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <div className="relative z-10">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <AnimatedInput
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <AnimatedInput
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors z-20"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={password} />
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00a0cb] hover:bg-[#00d4ff] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00a0cb] transition-colors relative overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center bg-[#00a0cb]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </motion.div>
                  ) : (
                    'Sign in'
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 