"use client"
import React from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export function AuthPage({ isSignin }: { isSignin: boolean }) {
  return (
    <div className="w-screen h-screen flex justify-center items-center bg-gray-900">
      <div className="p-8 m-4 bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          {isSignin ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        <div className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-5 w-5" />
            <input 
              type="email" 
              placeholder="Email"
              className="w-full pl-10 pr-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-5 w-5" />
            <input 
              type="password" 
              placeholder="Password"
              className="w-full pl-10 pr-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <button 
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center group"
          onClick={() => {}}
        >
          <span>{isSignin ? 'Sign in' : 'Sign up'}</span>
          <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
        </button>

        <p className="mt-4 text-center text-gray-400">
          {isSignin ? "Don't have an account? " : "Already have an account? "}
          <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
            {isSignin ? 'Sign up' : 'Sign in'}
          </a>
        </p>
      </div>
    </div>
  );
}
