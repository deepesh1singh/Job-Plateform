import { Layout } from "@/components/Layout";
import { useStore, UserRole, User } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AuthProps {
  initialTab?: 'login' | 'register';
}

export default function Auth({ initialTab = 'login' }: AuthProps) {
  const [, setLocation] = useLocation();
  const { registerUser, loginUser, users } = useStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [role, setRole] = useState<UserRole>('job_seeker');

  const { register: registerLogin, handleSubmit: handleSubmitLogin } = useForm();
  const { register: registerSignup, handleSubmit: handleSubmitSignup, watch: watchSignup } = useForm();

  const onLogin = (data: any) => {
    const user = loginUser(data.email, data.password);
    if (user) {
      toast({ title: "Welcome back!", description: `Logged in as ${user.email}` });
      if (user.role === 'admin') setLocation('/dashboard');
      else if (user.role === 'employer') setLocation('/dashboard');
      else setLocation('/');
    } else {
      toast({ title: "Error", description: "Invalid credentials", variant: "destructive" });
    }
  };

  const onRegister = (data: any) => {
    // Check if user exists
    if (users.find(u => u.email === data.email)) {
      toast({ title: "Error", description: "User already exists", variant: "destructive" });
      return;
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: data.email,
      password: data.password,
      role: role,
      legalName: data.legalName, // Only ask minimal info first
      isApproved: role === 'job_seeker' // Employers need approval
    };

    registerUser(newUser);
    
    if (role === 'employer') {
      toast({ title: "Registration Successful", description: "Your account is pending admin approval." });
    } else {
      toast({ title: "Registration Successful", description: "Please complete your profile to apply for jobs." });
      // Login automatically
      loginUser(data.email, data.password);
    }
    
    // Redirect
    if (role === 'job_seeker') setLocation('/profile'); // Send to profile to complete
    else setLocation('/'); 
  };

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[70vh]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>Enter your credentials to access your account.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmitLogin(onLogin)}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="m@example.com" {...registerLogin('email', { required: true })} />
                    </div>
                    <div className="space-y-2">
                       <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                      </div>
                      <Input id="password" type="password" {...registerLogin('password', { required: true })} />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" type="submit">Sign In</Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an Account</CardTitle>
                  <CardDescription>Join as a Job Seeker or Employer.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmitSignup(onRegister)}>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 mb-4">
                      <Label>I want to...</Label>
                      <RadioGroup defaultValue="job_seeker" onValueChange={(v) => setRole(v as UserRole)} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="job_seeker" id="r1" />
                          <Label htmlFor="r1">Find a Job</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="employer" id="r2" />
                          <Label htmlFor="r2">Hire Talent</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input id="reg-email" type="email" placeholder="m@example.com" {...registerSignup('email', { required: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-pass">Password</Label>
                      <Input id="reg-pass" type="password" {...registerSignup('password', { required: true })} />
                    </div>
                    {role === 'employer' && (
                       <div className="space-y-2">
                        <Label htmlFor="company">Company Name</Label>
                        <Input id="company" placeholder="Acme Inc." {...registerSignup('companyName')} />
                       </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" type="submit">Create Account</Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </Layout>
  );
}
