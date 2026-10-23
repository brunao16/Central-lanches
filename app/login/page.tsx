'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'customer' | 'restaurant_owner'>('restaurant_owner');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        // Criar conta no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            },
          },
        });

        if (authError) throw authError;

        if (authData.user) {
          // Criar registro na tabela profiles
          await supabase.from('profiles').upsert({
            id: authData.user.id,
            email: email,
            full_name: fullName,
            role: role,
          });

          setSuccessMsg('Conta criada com sucesso! Redirecionando...');
          setTimeout(() => {
            if (role === 'restaurant_owner') {
              router.push('/cadastro-restaurante');
            } else {
              router.push('/');
            }
          }, 1200);
        }
      } else {
        // Login existente
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Buscar perfil do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profile?.role === 'restaurant_owner') {
          router.push('/painel/restaurante');
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF0EB] to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-[#FF3B00] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-[#FF3B00]/25">
              C
            </div>
          </Link>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {isSignUp ? 'Criar sua conta' : 'Acesse sua conta'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isSignUp
              ? 'Comece a vender ou pedir em sua cidade'
              : 'Bem-vindo de volta ao Central Lanches'}
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Tipo de Conta
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setRole('restaurant_owner')}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      role === 'restaurant_owner'
                        ? 'bg-white text-[#FF3B00] shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Restaurante
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      role === 'customer'
                        ? 'bg-white text-[#FF3B00] shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Cliente
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome ou da sua empresa"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-hidden focus:border-[#FF3B00] focus:ring-2 focus:ring-[#FF3B00]/20 text-sm font-medium transition-all"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-hidden focus:border-[#FF3B00] focus:ring-2 focus:ring-[#FF3B00]/20 text-sm font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-hidden focus:border-[#FF3B00] focus:ring-2 focus:ring-[#FF3B00]/20 text-sm font-medium transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-[#FF3B00] hover:bg-[#E03400] text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#FF3B00]/25 transition-all disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Criar Conta' : 'Entrar no Painel'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Sign Up / Login */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="ml-2 font-bold text-[#FF3B00] hover:underline cursor-pointer"
            >
              {isSignUp ? 'Fazer login' : 'Cadastre-se grátis'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
