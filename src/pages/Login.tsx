import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useWeb3 } from "@/contexts/Web3Context";
import { useAuth } from "@/contexts/AuthContext";
import { Wallet, Loader2, AlertCircle, ArrowRight, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { connect, disconnect, isConnected, isConnecting, address, error: web3Error, clearError: clearWeb3Error } = useWeb3();
  const { signIn, user, role, isLoading, error: authError, clearError: clearAuthError } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const from = (location.state as any)?.from?.pathname || "/";

  // Redirect if already authenticated
  useEffect(() => {
    if (user && role && isConnected) {
      const redirectPath = role === "advertiser" 
        ? "/advertiser" 
        : role === "influencer" 
          ? "/influencer" 
          : role === "admin"
            ? "/admin"
            : from;
      navigate(redirectPath, { replace: true });
    }
  }, [user, role, isConnected, navigate, from]);

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

  const handleSignIn = async () => {
    setIsSigningIn(true);
    clearAuthError();
    try {
      await signIn();
    } finally {
      setIsSigningIn(false);
    }
  };

  const error = web3Error || authError;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Form */}
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
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Connect your wallet to sign in to your account
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Wallet Connection */}
          <div className="space-y-4">
            {!isConnected ? (
              <Button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="w-full h-14 text-lg gap-3"
                size="lg"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    Connect Wallet
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                {/* Connected Wallet Display */}
                <div className="p-4 rounded-lg border border-border bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Connected Wallet</p>
                        <p className="font-mono font-medium text-foreground">
                          {address?.slice(0, 6)}...{address?.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <Button
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

                {/* Sign In Button */}
                <Button
                  onClick={handleSignIn}
                  disabled={isSigningIn || isLoading}
                  className="w-full h-14 text-lg gap-2"
                  size="lg"
                >
                  {isSigningIn || isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">
                or
              </span>
            </div>
          </div>

          {/* Wallet Options */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center mb-4">
              We support the following wallets:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg border border-border text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <span className="text-orange-500 text-xl">🦊</span>
                </div>
                <p className="text-sm font-medium text-foreground">MetaMask</p>
              </div>
              <div className="p-4 rounded-lg border border-border text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <span className="text-blue-500 text-xl">🔗</span>
                </div>
                <p className="text-sm font-medium text-foreground">WalletConnect</p>
              </div>
            </div>
          </div>

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image/Branding */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-4">
            Where Brands Meet Influence
          </h2>
          <p className="text-primary-foreground/80 text-lg">
            Connect with top creators and grow your brand with secure, transparent collaborations powered by blockchain escrow.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
