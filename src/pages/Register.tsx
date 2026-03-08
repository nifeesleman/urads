import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWeb3 } from "@/contexts/Web3Context";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Wallet, Loader2, AlertCircle, User, Building2, Sparkles, ArrowRight, X, Fingerprint } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = (searchParams.get("role") as UserRole) || "influencer";

  const { connect, disconnect, isConnected, isConnecting, address, error: web3Error, clearError: clearWeb3Error } = useWeb3();
  const { signUp, user, role: userRole, isLoading, error: authError, clearError: clearAuthError } = useAuth();

  const [role, setRole] = useState<UserRole>(defaultRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && userRole && isConnected) {
      const redirectPath = userRole === "advertiser"
        ? "/advertiser"
        : userRole === "influencer"
          ? "/influencer"
          : "/admin";
      navigate(redirectPath, { replace: true });
    }
  }, [user, userRole, isConnected, navigate]);

  const handleConnectWallet = async () => {
    clearWeb3Error();
    clearAuthError();
    await connect();
  };

  const handleDisconnectWallet = () => {
    clearWeb3Error();
    clearAuthError();
    disconnect();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    clearAuthError();
    try {
      await signUp(role, name.trim(), email.trim() || undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const error = web3Error || authError;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Image/Branding */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-8">
        <div className="max-w-md text-center">
          <Sparkles className="w-16 h-16 text-primary-foreground mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-primary-foreground mb-4">
            Start Your Journey
          </h2>
          <p className="text-primary-foreground/80 text-lg">
            {role === "influencer"
              ? "Turn your influence into income. Connect with top brands and get paid securely via blockchain escrow."
              : "Find the perfect creators for your campaigns. Reach millions of engaged followers with transparent pricing."}
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">U</span>
            </div>
            <span className="text-2xl font-bold text-foreground">UrAds</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Create your account
            </h1>
            <p className="text-muted-foreground">
              Join thousands of brands and creators on UrAds
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Role Selection */}
          <div className="mb-6">
            <Label className="mb-3 block">I want to join as a</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("influencer")}
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  role === "influencer"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Creator</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("advertiser")}
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  role === "advertiser"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span className="font-medium">Advertiser</span>
              </button>
            </div>
          </div>

          {/* Wallet Connection */}
          {!isConnected ? (
            <Button
              onClick={handleConnectWallet}
              disabled={isConnecting}
              className="w-full h-14 text-lg gap-3 mb-6"
              size="lg"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting Wallet...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  Connect Wallet to Continue
                </>
              )}
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Connected Wallet Display */}
              <div className="p-4 rounded-lg border border-primary/50 bg-primary/5 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Wallet Connected</p>
                      <p className="font-mono font-medium text-foreground">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleDisconnectWallet}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    title="Disconnect wallet"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  {role === "influencer" ? "Display Name" : "Company Name"}
                </Label>
                <div className="relative">
                  {role === "influencer" ? (
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  )}
                  <Input
                    id="name"
                    type="text"
                    placeholder={role === "influencer" ? "Your creator name" : "Your company name"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              {/* Email Input (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground">
                  For notifications and account recovery
                </p>
              </div>

              {/* Signature info */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-start gap-2">
                  <Fingerprint className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    You'll sign a message with your wallet to verify ownership. No password needed — your wallet is your key.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || isLoading || !name.trim()}
                className="w-full h-14 text-lg gap-2"
                size="lg"
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying & Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Terms */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            By signing up, you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>

          {/* Login Link */}
          <p className="mt-4 text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
