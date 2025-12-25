import { Layout } from "@/components/Layout";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, DollarSign, Clock, Briefcase } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const { jobs } = useStore();
  const [searchTerm, setSearchTerm] = useState("");

  const activeJobs = jobs.filter(job => job.status === 'active');
  
  const filteredJobs = activeJobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12 md:py-20 relative overflow-hidden rounded-3xl bg-primary/5 border border-primary/10">
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=2072&auto=format&fit=crop')] opacity-5 bg-cover bg-center" />
           
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
             className="relative z-10 max-w-2xl mx-auto px-4"
           >
             <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tight mb-4">
               Find Your Next <span className="text-primary">Dream Job</span>
             </h1>
             <p className="text-lg text-muted-foreground mb-8">
               Explore thousands of job opportunities with all the information you need. Its fast, simple and easy.
             </p>
             
             <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto bg-background p-2 rounded-xl shadow-lg border">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input 
                   className="pl-9 border-none shadow-none focus-visible:ring-0 h-12" 
                   placeholder="Job title, keywords, or company" 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
               </div>
               <Button size="lg" className="h-12 px-8 rounded-lg">
                 Search
               </Button>
             </div>
           </motion.div>
        </div>

        {/* Job Listings */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-heading">Latest Opportunities</h2>
            <span className="text-muted-foreground text-sm">{filteredJobs.length} jobs found</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link href={`/jobs/${job.id}`}>
                    <Card className="h-full hover:shadow-lg transition-all duration-300 border-muted bg-card hover:border-primary/50 cursor-pointer group">
                      <CardHeader className="space-y-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl group-hover:text-primary transition-colors">{job.title}</CardTitle>
                            <p className="text-sm font-medium text-muted-foreground mt-1">{job.companyName}</p>
                          </div>
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                            {job.companyName.charAt(0)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="font-normal">
                            <Briefcase className="w-3 h-3 mr-1" />
                            {job.type}
                          </Badge>
                          <Badge variant="secondary" className="font-normal">
                            <MapPin className="w-3 h-3 mr-1" />
                            {job.location}
                          </Badge>
                          <Badge variant="secondary" className="font-normal">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {job.salary}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {job.description}
                        </p>
                      </CardContent>
                      <CardFooter className="pt-2 border-t bg-muted/20">
                         <div className="flex items-center text-xs text-muted-foreground w-full justify-between">
                           <span className="flex items-center">
                             <Clock className="w-3 h-3 mr-1" />
                             Posted {new Date(job.createdAt).toLocaleDateString()}
                           </span>
                           <span className="group-hover:translate-x-1 transition-transform text-primary font-medium">
                             View Details →
                           </span>
                         </div>
                      </CardFooter>
                    </Card>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No jobs found matching your criteria.</p>
                <p>Try adjusting your search terms.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
