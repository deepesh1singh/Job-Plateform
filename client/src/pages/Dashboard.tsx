import { Layout } from "@/components/Layout";
import { useStore, Job, Application } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { Plus, Trash, Edit, Eye, Check, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Dashboard() {
  const { currentUser, jobs, applications, deleteJob, addJob, updateApplicationStatus, users, updateUser, deleteUser, updateJob } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  if (!currentUser) {
    setLocation("/login");
    return null;
  }

  // --- Job Seeker View ---
  if (currentUser.role === 'job_seeker') {
    const myApplications = applications.filter(a => a.jobSeekerId === currentUser.id);
    
    return (
      <Layout>
        <div className="max-w-5xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold font-heading">My Applications</h1>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myApplications.length > 0 ? (
                    myApplications.map(app => {
                      const job = jobs.find(j => j.id === app.jobId);
                      return (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">{job?.title || 'Unknown Job'}</TableCell>
                          <TableCell>{job?.companyName || 'Unknown Company'}</TableCell>
                          <TableCell>{new Date(app.appliedAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={app.status === 'accepted' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'}>
                              {app.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        You haven't applied to any jobs yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // --- Employer View ---
  if (currentUser.role === 'employer') {
    if (!currentUser.isApproved) {
      return (
        <Layout>
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
            <h1 className="text-2xl font-bold mb-4">Account Pending Approval</h1>
            <p className="text-muted-foreground max-w-md">
              Your employer account is currently under review by the administrator. 
              You will be able to post jobs once approved.
            </p>
          </div>
        </Layout>
      );
    }

    const myJobs = jobs.filter(j => j.employerId === currentUser.id);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);

    const handleCreateJob = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const newJob: Job = {
        id: Math.random().toString(36).substr(2, 9),
        employerId: currentUser.id,
        title: formData.get('title') as string,
        companyName: currentUser.companyName || 'My Company',
        description: formData.get('description') as string,
        salary: formData.get('salary') as string,
        location: formData.get('location') as string,
        type: formData.get('type') as any,
        skillsRequired: (formData.get('skills') as string).split(',').map(s => s.trim()),
        experience: formData.get('experience') as string,
        lastDate: formData.get('lastDate') as string,
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      
      addJob(newJob);
      setIsCreateOpen(false);
      toast({ title: "Job Posted", description: "Your job listing is now live." });
    };

    const handleEditJob = (e: React.FormEvent) => {
       e.preventDefault();
       if(!editingJob) return;
       const formData = new FormData(e.target as HTMLFormElement);
       
       updateJob(editingJob.id, {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        salary: formData.get('salary') as string,
        location: formData.get('location') as string,
        type: formData.get('type') as any,
        skillsRequired: (formData.get('skills') as string).split(',').map(s => s.trim()),
        experience: formData.get('experience') as string,
        lastDate: formData.get('lastDate') as string,
       });

       setEditingJob(null);
       toast({ title: "Job Updated", description: "Changes saved successfully." });
    };

    return (
      <Layout>
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold font-heading">Employer Dashboard</h1>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Create New Job</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Create New Job</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateJob} className="space-y-4">
                  <div><Label>Job Title</Label><Input name="title" required /></div>
                  <div><Label>Description</Label><Input name="description" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Salary Range</Label><Input name="salary" placeholder="$50k - $80k" required /></div>
                    <div><Label>Location</Label><Input name="location" placeholder="City" required /></div>
                  </div>
                  <div>
                    <Label>Job Type</Label>
                    <select name="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <option value="Full-time">Full-time</option>
                      <option value="Internship">Internship</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>
                  <div><Label>Required Skills (comma separated)</Label><Input name="skills" placeholder="React, Node, SQL" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                     <div><Label>Experience</Label><Input name="experience" placeholder="e.g. 2 years" required /></div>
                     <div><Label>Last Date to Apply</Label><Input name="lastDate" type="date" required /></div>
                  </div>
                  <Button type="submit" className="w-full">Post Job</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

           {/* Edit Dialog */}
           <Dialog open={!!editingJob} onOpenChange={(o) => !o && setEditingJob(null)}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Edit Job</DialogTitle></DialogHeader>
                {editingJob && (
                  <form onSubmit={handleEditJob} className="space-y-4">
                    <div><Label>Job Title</Label><Input name="title" defaultValue={editingJob.title} required /></div>
                    <div><Label>Description</Label><Input name="description" defaultValue={editingJob.description} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Salary Range</Label><Input name="salary" defaultValue={editingJob.salary} required /></div>
                      <div><Label>Location</Label><Input name="location" defaultValue={editingJob.location} required /></div>
                    </div>
                    <div>
                      <Label>Job Type</Label>
                      <select name="type" defaultValue={editingJob.type} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <option value="Full-time">Full-time</option>
                        <option value="Internship">Internship</option>
                        <option value="Remote">Remote</option>
                      </select>
                    </div>
                    <div><Label>Required Skills</Label><Input name="skills" defaultValue={editingJob.skillsRequired.join(', ')} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Experience</Label><Input name="experience" defaultValue={editingJob.experience} required /></div>
                      <div><Label>Last Date to Apply</Label><Input name="lastDate" type="date" defaultValue={editingJob.lastDate} required /></div>
                    </div>
                    <Button type="submit" className="w-full">Save Changes</Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>

          <Card>
            <CardHeader><CardTitle>My Posted Jobs</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Applicants</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myJobs.map(job => {
                    const jobApplicants = applications.filter(a => a.jobId === job.id);
                    return (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>{jobApplicants.length}</TableCell>
                        <TableCell>{new Date(job.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setEditingJob(job)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="destructive" size="sm" onClick={() => {
                              if(confirm('Are you sure you want to delete this job?')) deleteJob(job.id);
                            }}><Trash className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {/* Applicants Section - Simplified for Mockup */}
          <Card>
             <CardHeader><CardTitle>Recent Applicants</CardTitle></CardHeader>
             <CardContent>
                <Table>
                   <TableHeader><TableRow><TableHead>Candidate</TableHead><TableHead>Job</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                   <TableBody>
                      {applications.filter(a => myJobs.some(j => j.id === a.jobId)).map(app => {
                         const job = jobs.find(j => j.id === app.jobId);
                         const applicant = users.find(u => u.id === app.jobSeekerId);
                         return (
                            <TableRow key={app.id}>
                               <TableCell>{applicant?.legalName || applicant?.email}</TableCell>
                               <TableCell>{job?.title}</TableCell>
                               <TableCell><Badge>{app.status}</Badge></TableCell>
                               <TableCell>
                                  {app.status === 'pending' && (
                                     <div className="flex gap-2">
                                        <Button size="sm" onClick={() => updateApplicationStatus(app.id, 'accepted')}><Check className="h-4 w-4" /></Button>
                                        <Button size="sm" variant="destructive" onClick={() => updateApplicationStatus(app.id, 'rejected')}><X className="h-4 w-4" /></Button>
                                     </div>
                                  )}
                               </TableCell>
                            </TableRow>
                         )
                      })}
                   </TableBody>
                </Table>
             </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // --- Admin View ---
  if (currentUser.role === 'admin') {
     const employers = users.filter(u => u.role === 'employer');
     const jobSeekers = users.filter(u => u.role === 'job_seeker');

     return (
        <Layout>
           <div className="max-w-6xl mx-auto space-y-8">
              <h1 className="text-3xl font-bold font-heading">Admin Dashboard</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Employers</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{employers.length}</div></CardContent>
                 </Card>
                 <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Job Seekers</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{jobSeekers.length}</div></CardContent>
                 </Card>
                 <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Jobs</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{jobs.length}</div></CardContent>
                 </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Applications</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{applications.length}</div></CardContent>
                 </Card>
              </div>

              <Tabs defaultValue="employers">
                 <TabsList>
                    <TabsTrigger value="employers">Manage Employers</TabsTrigger>
                    <TabsTrigger value="seekers">Manage Job Seekers</TabsTrigger>
                    <TabsTrigger value="jobs">Manage Jobs</TabsTrigger>
                 </TabsList>

                 <TabsContent value="employers">
                    <Card>
                       <CardContent className="pt-6">
                          <Table>
                             <TableHeader><TableRow><TableHead>Company</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                             <TableBody>
                                {employers.map(emp => (
                                   <TableRow key={emp.id}>
                                      <TableCell>{emp.companyName}</TableCell>
                                      <TableCell>{emp.email}</TableCell>
                                      <TableCell>
                                         <Badge variant={emp.isApproved ? "default" : "secondary"}>
                                            {emp.isApproved ? "Approved" : "Pending"}
                                         </Badge>
                                      </TableCell>
                                      <TableCell>
                                         <div className="flex gap-2">
                                            {!emp.isApproved && (
                                               <Button size="sm" onClick={() => updateUser(emp.id, { isApproved: true })}>Approve</Button>
                                            )}
                                            <Button size="sm" variant="destructive" onClick={() => deleteUser(emp.id)}><Trash className="h-4 w-4" /></Button>
                                         </div>
                                      </TableCell>
                                   </TableRow>
                                ))}
                             </TableBody>
                          </Table>
                       </CardContent>
                    </Card>
                 </TabsContent>
                 
                 <TabsContent value="seekers">
                     <Card>
                       <CardContent className="pt-6">
                          <Table>
                             <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                             <TableBody>
                                {jobSeekers.map(seeker => (
                                   <TableRow key={seeker.id}>
                                      <TableCell>{seeker.legalName}</TableCell>
                                      <TableCell>{seeker.email}</TableCell>
                                      <TableCell>
                                         <Button size="sm" variant="destructive" onClick={() => deleteUser(seeker.id)}><Trash className="h-4 w-4" /></Button>
                                      </TableCell>
                                   </TableRow>
                                ))}
                             </TableBody>
                          </Table>
                       </CardContent>
                    </Card>
                 </TabsContent>

                 <TabsContent value="jobs">
                    <Card>
                       <CardContent className="pt-6">
                          <Table>
                             <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Company</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                             <TableBody>
                                {jobs.map(job => (
                                   <TableRow key={job.id}>
                                      <TableCell>{job.title}</TableCell>
                                      <TableCell>{job.companyName}</TableCell>
                                      <TableCell>
                                         <Button size="sm" variant="destructive" onClick={() => deleteJob(job.id)}><Trash className="h-4 w-4" /></Button>
                                      </TableCell>
                                   </TableRow>
                                ))}
                             </TableBody>
                          </Table>
                       </CardContent>
                    </Card>
                 </TabsContent>
              </Tabs>
           </div>
        </Layout>
     );
  }

  return <div>Unknown Role</div>;
}
