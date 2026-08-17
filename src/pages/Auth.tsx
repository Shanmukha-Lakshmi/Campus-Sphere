import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, Mail, Lock, User, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth, googleProvider, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupRole, setSignupRole] = useState<string>("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const getFriendlyErrorMessage = (error: any): string => {
    const code = error?.code || "";
    const message = error?.message || "";

    if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
      return "Account not found or incorrect credentials. If you haven't created an account yet, please click the 'Sign Up' tab above.";
    }
    if (code === "auth/wrong-password") {
      return "Incorrect password. Please try again or reset your password.";
    }
    if (code === "auth/email-already-in-use") {
      return "An account with this email already exists! Please click the 'Sign In' tab above to log in.";
    }
    if (code === "auth/popup-closed-by-user") {
      return "Google sign-in popup was closed before completing.";
    }
    if (code === "auth/unauthorized-domain") {
      return "This domain is not authorized for Google Sign-In in your Firebase Console.";
    }
    if (code === "auth/network-request-failed") {
      return "Network error. Please check your internet connection and try again.";
    }
    if (message.includes("Only @svecw.edu.in")) {
      return message;
    }
    return message || "An unexpected authentication error occurred. Please try again.";
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email || "";
      const ADMIN_EMAIL = "admin@svecw.edu.in";
      const isValidDomain = email.endsWith("@svecw.edu.in");

      if (email !== ADMIN_EMAIL && !isValidDomain) {
        // If not admin and not valid domain, reject
        await result.user.delete(); // Cleanup the user created by popup
        throw new Error("Only @svecw.edu.in email addresses are allowed.");
      }

      // Try saving/updating Firestore profile safely (don't block navigation if Firestore fails)
      try {
        const userDocRef = doc(db, "users", result.user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          const role = email === ADMIN_EMAIL ? "admin" : "student";
          await setDoc(userDocRef, {
            email: email,
            full_name: email === ADMIN_EMAIL ? "Admin" : (result.user.displayName || "User"),
            role: role,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          });
        } else {
          await setDoc(userDocRef, {
            email: email,
            full_name: email === ADMIN_EMAIL ? "Admin" : (result.user.displayName || "User"),
            last_login: new Date().toISOString()
          }, { merge: true });
        }
      } catch (firestoreError) {
        console.warn("Firestore user document sync warning:", firestoreError);
      }

      toast({
        title: "Google Sign-In",
        description: "Successfully signed in with Google.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      toast({
        title: "Access Denied",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const validatePassword = (password: string) => {
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasLetter && hasNumber;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const ADMIN_EMAIL = "admin@svecw.edu.in";

    try {
      // Basic domain validation before even trying Firebase
      if (loginEmail !== ADMIN_EMAIL && !loginEmail.endsWith("@svecw.edu.in")) {
        throw new Error("Only @svecw.edu.in email addresses are allowed.");
      }

      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);

      // Attempt to ensure user profile exists in Firestore (safely)
      try {
        const userDocRef = doc(db, "users", userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          const role = loginEmail === ADMIN_EMAIL ? "admin" : "student";
          await setDoc(userDocRef, {
            email: loginEmail,
            full_name: userCredential.user.displayName || (loginEmail === ADMIN_EMAIL ? "Admin" : "Student"),
            role: role,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          });
        } else {
          await setDoc(userDocRef, {
            last_login: new Date().toISOString()
          }, { merge: true });
        }
      } catch (fsErr) {
        console.warn("Firestore login sync warning:", fsErr);
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupRole) {
      toast({
        title: "Please select a role",
        description: "You must select your role to continue.",
        variant: "destructive",
      });
      return;
    }

    const ADMIN_EMAIL = "admin@svecw.edu.in";

    // Domain validation
    if (signupEmail !== ADMIN_EMAIL && !signupEmail.endsWith("@svecw.edu.in")) {
      toast({
        title: "Invalid Email",
        description: "Only @svecw.edu.in email addresses are allowed.",
        variant: "destructive",
      });
      return;
    }

    // Password validation
    if (!validatePassword(signupPassword)) {
      toast({
        title: "Weak Password",
        description: "Password must contain both letters and numbers.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);

      // Update profile with name
      await updateProfile(userCredential.user, {
        displayName: signupEmail === ADMIN_EMAIL ? "Admin" : signupName
      });

      const finalRole = signupEmail === ADMIN_EMAIL ? "admin" : signupRole;
      const finalName = signupEmail === ADMIN_EMAIL ? "Admin" : signupName;

      // Save user role to Firestore (safely, so errors don't prevent navigation)
      try {
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: signupEmail,
          full_name: finalName,
          role: finalRole,
          created_at: new Date().toISOString()
        });
      } catch (firestoreError) {
        console.warn("Firestore signup setDoc warning:", firestoreError);
      }

      toast({
        title: "Account created!",
        description: "Welcome to Campusphere.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Signup Error Details:", error);
      toast({
        title: "Signup Failed",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Back to Home */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <Card className="glass-card border-border/50">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto p-3 rounded-xl bg-primary text-primary-foreground w-fit">
              <GraduationCap className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-serif">Welcome to Campusphere</CardTitle>
            <CardDescription>
              Sign in to access your dashboard or create a new account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email or Roll Number</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@college.edu"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <a href="#" className="text-sm text-accent hover:underline">
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full btn-primary-gradient"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>

                <div className="relative my-4">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                    or continue with
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  Sign in with Google
                </Button>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">College Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@college.edu"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-role">I am a</Label>
                    <Select value={signupRole} onValueChange={setSignupRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="faculty">Faculty Member</SelectItem>
                        <SelectItem value="club_member">Club Member</SelectItem>

                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Min. 6 characters"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full btn-primary-gradient"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>

                <div className="relative my-4">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                    or continue with
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  Sign up with Google
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          By continuing, you agree to our{" "}
          <a href="#" className="text-accent hover:underline">Terms of Service</a>
          {" "}and{" "}
          <a href="#" className="text-accent hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default Auth;

