"use client"
import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useFormValidation, FormErrors, PasswordRequirements } from './FormValidation';

export function AuthPage({ isSignin }: { isSignin: boolean }) {
  const router = useRouter();
  const { validateField } = useFormValidation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    const newErrors = validateField(name, value, errors);
    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    
    // Validate all fields before submission
    const newErrors: FormErrors = {};
    Object.keys(formData).forEach(key => {
      if (formData[key as keyof typeof formData]) {
        const fieldErrors = validateField(key, formData[key as keyof typeof formData], newErrors);
        Object.assign(newErrors, fieldErrors);
      }
    });
    setErrors(newErrors);

    // Check if there are any errors
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const endpoint = isSignin ? '/api/signin' : '/api/signup';
      const response = await axios.post(endpoint, formData);
      
      if (isSignin) {
        localStorage.setItem('token', response.data.token);
        router.push('/dashboard');
      } else {
        router.push('/signin');
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-gray-900">
      <div className="p-8 m-4 bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          {isSignin ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        {submitError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-500 text-sm">
            {submitError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isSignin && (
            <div className="space-y-1">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-5 w-5" />
                <input 
                  type="text" 
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username"
                  className={`w-full pl-10 pr-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.username ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                  }`}
                />
              </div>
              {errors.username && (
                <p className="text-red-500 text-sm">{errors.username}</p>
              )}
            </div>
          )}
          
          <div className="space-y-1">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-5 w-5" />
              <input 
                type="text" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={isSignin ? "Email or Username" : "Email"}
                className={`w-full pl-10 pr-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-5 w-5" />
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className={`w-full pl-10 pr-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.password ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                }`}
              />
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password}</p>
            )}
            {!isSignin && <PasswordRequirements password={formData.password} />}
          </div>

          <button 
            type="submit"
            disabled={loading || Object.keys(errors).length > 0}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Processing...' : (isSignin ? 'Sign in' : 'Sign up')}</span>
            {!loading && <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-400">
          {isSignin ? "Don't have an account? " : "Already have an account? "}
          <Link href={isSignin ? "/signup" : "/signin"} className="text-blue-400 hover:text-blue-300 transition-colors">
            {isSignin ? 'Sign up' : 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  );
}
