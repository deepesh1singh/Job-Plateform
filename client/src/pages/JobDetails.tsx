import { Layout } from "@/components/Layout";
import { useStore, Job } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, DollarSign, Briefcase, Clock, CheckCircle } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function JobDetails() {
  const [, params] = useRoute("/jobs/:id");
  const [, setLocation] = useLocation();
  const { jobs, currentUser, applyToJob, applications } = useStore();
  const { toast } = useToast();
  
  const job = jobs.find(j => j.id === params?.id);
  
  if (!job) return <Layout><div className="p-8 text-center">Job not found</div></Layout>;

  const hasApplied = currentUser && applications.some(a => a.jobId === job.id && a.jobSeekerId === currentUser.id);

  const handleApply = () => {
    if (!currentUser) {
      toast({ title: "Authentication Required", description: "Please login or register to apply." });
      setLocation("/login");
      return;
    }
    
    if (currentUser.role !== 'job_seeker') {
       toast({ title: "Role Error", description: "Only job seekers can apply.", variant: "destructive" });
       return;
    }

    // Check if profile is complete (basic check)
    if (!currentUser.legalName || !currentUser.phone) {
      toast({ title: "Profile Incomplete", description: "Please complete your profile before applying.", variant: "destructive" });
      setLocation("/profile");
      return;
    }

    applyToJob({
      id: Math.random().toString(36).substr(2, 9),
      jobId: job.id,
      jobSeekerId: currentUser.id,
      status: 'pending',
      appliedAt: new Date().toISOString()
    });

    toast({ title: "Application Submitted", description: "Good luck!" });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <Button variant="ghost" onClick={() => window.history.back()} className="gap-2 pl-0 hover:pl-2 transition-all">
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-start justify-between mb-6">
                 <div>
                   <h1 className="text-3xl font-bold font-heading mb-2">{job.title}</h1>
                   <div className="text-xl text-primary font-medium">{job.companyName}</div>
                 </div>
                 <div className="h-16 w-16 bg-primary/10 rounded-xl flex items-center justify-center text-2xl font-bold text-primary">
                    {job.companyName.charAt(0)}
                 </div>
              </div>

              <div className="flex flex-wrap gap-4 mb-8">
                <Badge variant="outline" className="px-3 py-1 text-sm"><MapPin className="w-3 h-3 mr-2" /> {job.location}</Badge>
                <Badge variant="outline" className="px-3 py-1 text-sm"><Briefcase className="w-3 h-3 mr-2" /> {job.type}</Badge>
                <Badge variant="outline" className="px-3 py-1 text-sm"><DollarSign className="w-3 h-3 mr-2" /> {job.salary}</Badge>
                <Badge variant="outline" className="px-3 py-1 text-sm"><Clock className="w-3 h-3 mr-2" /> Exp: {job.experience}</Badge>
              </div>

              <section className="space-y-4">
                <h3 className="text-xl font-bold font-heading">Job Description</h3>
                <div className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-line">
                  {job.description}
                </div>
              </section>

              <section className="space-y-4 mt-8">
                <h3 className="text-xl font-bold font-heading">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skillsRequired.map(skill => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </section>
            </motion.div>
          </div>

          <div className="md:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Job Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Posted Date</span>
                  <p className="font-medium">{new Date(job.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Application Deadline</span>
                  <p className="font-medium">{job.lastDate}</p>
                </div>
                
                <div className="pt-4">
                  {hasApplied ? (
                    <Button className="w-full bg-green-600 hover:bg-green-700 cursor-default">
                      <CheckCircle className="mr-2 h-4 w-4" /> Applied
                    </Button>
                  ) : (
                    <Button className="w-full" size="lg" onClick={handleApply}>
                      Apply Now
                    </Button>
                  )}
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    {hasApplied ? "You have already applied to this position." : "Register or Login required to apply."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
