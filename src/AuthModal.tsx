import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, CheckCircle, AlertCircle, Chrome } from 'lucide-react';
import { useAuth } from './AuthContext';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signIn } = useAuth(); // We might not use this if we handle Google directly here
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validatePhone = (p: string) => {
    return /^010-\d{4}-\d{4}$/.test(p);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('성함을 입력해주세요.');
        if (!validatePhone(phone)) throw new Error('연락처는 010-XXXX-XXXX 형식으로 입력해주세요.');
        if (password.length < 6) throw new Error('비밀번호는 6자리 이상이어야 합니다.');

        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: name });
        // Create user document
        const userDocRef = doc(db, 'users', credential.user.uid);
        
        let role = 'user';
        try {
          const sysConfigRef = doc(db, 'system', 'config');
          const sysConfigSnap = await getDoc(sysConfigRef);
          if (!sysConfigSnap.exists() || !sysConfigSnap.data().adminClaimed) {
             role = 'admin';
             await setDoc(sysConfigRef, { adminClaimed: true }, { merge: true });
          }
        } catch (configError) {}

        await setDoc(userDocRef, {
          email: email,
          displayName: name,
          phone: phone,
          photoURL: '',
          role: role,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });

      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setError(err.message || '인증 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signIn(); // uses existing google popup flow
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google 로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneInput = (value: string) => {
    const rawValue = value.replace(/-/g, '');
    let formatted = rawValue;
    if (rawValue.length > 3) {
      formatted = rawValue.slice(0, 3) + '-' + rawValue.slice(3);
    }
    if (rawValue.length > 7) {
      formatted = formatted.slice(0, 8) + '-' + rawValue.slice(7, 11);
    }
    return formatted.slice(0, 13);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white mb-2">
            {mode === 'login' ? '로그인' : '회원가입'}
          </h2>
          <p className="text-zinc-400 text-sm">
            혁신 수익화 캘린더 여정을 시작하세요
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6 flex gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-400">성함</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-amber-400 transition-colors"
                    placeholder="홍길동"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-400">연락처</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-amber-400 transition-colors"
                    placeholder="010-0000-0000"
                    pattern="010-[0-9]{4}-[0-9]{4}"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400">이메일</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-amber-400 transition-colors"
                placeholder="hello@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-amber-400 transition-colors"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-black font-black rounded-xl transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? '처리 중...' : mode === 'login' ? '이메일로 로그인' : '가입하기'}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink-0 mx-4 text-zinc-500 text-xs font-medium">소셜 계정으로 계속하기</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>
          
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-zinc-100 text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Chrome className="w-5 h-5" />
            Google 계정 연동하기
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-zinc-500">
          {mode === 'login' ? (
            <p>
              아직 계정이 없으신가요?{' '}
              <button onClick={() => setMode('signup')} className="text-amber-400 font-bold hover:underline">
                회원가입
              </button>
            </p>
          ) : (
            <p>
              이미 계정이 있으신가요?{' '}
              <button onClick={() => setMode('login')} className="text-amber-400 font-bold hover:underline">
                로그인
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
