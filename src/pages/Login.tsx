import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, Stethoscope } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        // Fetch role from profiles to decide redirect
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          const role = profile?.role?.toLowerCase();
          if (role === 'admin') {
            navigate('/dashboard');
          } else {
            navigate('/walk-ins');
          }
        } else {
          navigate('/dashboard');
        }
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch {
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="mb-8 inline-block bg-white rounded-xl p-4 shadow-lg">
            <Stethoscope className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            TruCare
          </h1>
          <p className="text-white/80 text-lg">
            Streamline your daily clinic operations with our comprehensive digital MIS solution.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 text-left">
            {[
              'Employee Registration', 'Walk-in Tracking',
              'Medicine Inventory', 'Emergency Management',
              'Biomedical Waste Logs', 'Digital Prescriptions',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-white/90">
                <div className="w-2 h-2 rounded-full bg-white/60" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-muted/30">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="lg:hidden mb-4">
              <Stethoscope className="h-12 w-12 text-primary mx-auto" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to access your clinic dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="animate-fade-in">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="form-group">
                <Label htmlFor="email" className="form-label">Email Address</Label>
                <Input
                  id="email" type="email"
                  placeholder="you@company.truworth.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  required className="h-11"
                />
              </div>

              <div className="form-group">
                <Label htmlFor="password" className="form-label">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</>
                ) : 'Sign In'}
              </Button>
            </form>

            {/* Info */}
            <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2">Login with your Supabase Auth credentials</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Contact your admin to get your account credentials.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
