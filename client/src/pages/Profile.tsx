import { Layout } from "@/components/Layout";
import { useStore, User } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Plus, Trash2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Mock Data for Autocomplete
const COUNTRIES = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "India", "China", "Japan", "Brazil"];
const CITIES: Record<string, string[]> = {
  "United States": ["New York", "Los Angeles", "Chicago", "San Francisco", "Seattle"],
  "India": ["Delhi", "Mumbai", "Bangalore", "Hyderabad"],
  // default
  "default": ["City A", "City B", "City C"]
};
const UNIVERSITIES = ["Harvard University", "Stanford University", "MIT", "University of California", "Oxford", "Cambridge", "IIT Bombay", "IIT Delhi"];
const DEGREES = ["B.Tech", "B.E.", "B.Sc", "M.Tech", "M.Sc", "PhD", "MBA"];
const MAJORS = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil", "Business"];

function Autocomplete({ options, value, onChange, placeholder }: { options: string[], value: string, onChange: (val: string) => void, placeholder: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option ? "opacity-100" : "opacity-0")} />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function Profile() {
  const { currentUser, updateUser } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) setLocation("/login");
  }, [currentUser, setLocation]);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<User>({
    defaultValues: {
      ...currentUser,
      websites: currentUser?.websites || [''],
    }
  });

  const websites = watch("websites") || [];
  const selectedCountry = watch("country") || "";
  
  // Dynamic city options based on country
  const cityOptions = (CITIES[selectedCountry] || CITIES["default"]);

  const onSubmit = (data: User) => {
    updateUser(currentUser!.id, data);
    toast({ title: "Profile Updated", description: "Your information has been saved." });
  };

  if (!currentUser) return null;

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="max-w-3xl mx-auto py-8 space-y-8"
      >
        <div>
          <h1 className="text-3xl font-bold font-heading">My Profile</h1>
          <p className="text-muted-foreground">Complete your profile to apply for jobs faster.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* 1. Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>1. Basic Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Legal Name *</Label>
                <Input {...register("legalName", { required: true })} className={errors.legalName ? "border-red-500" : ""} />
                {errors.legalName && <span className="text-xs text-red-500">Required</span>}
              </div>
              <div className="space-y-2">
                <Label>Preferred Name *</Label>
                <Input {...register("preferredName", { required: true })} />
              </div>
              
              <div className="space-y-2">
                <Label>Country *</Label>
                <Autocomplete 
                  options={COUNTRIES} 
                  value={watch("country") || ""} 
                  onChange={(val) => setValue("country", val)} 
                  placeholder="Select Country"
                />
              </div>
              
              <div className="space-y-2">
                <Label>City *</Label>
                 <Autocomplete 
                  options={cityOptions} 
                  value={watch("city") || ""} 
                  onChange={(val) => setValue("city", val)} 
                  placeholder="Select City"
                />
              </div>
              
              <div className="space-y-2">
                <Label>State/Province *</Label>
                <Input {...register("state", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Zip Code *</Label>
                <Input {...register("zipCode", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input type="email" {...register("email")} disabled />
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <div className="flex gap-2">
                   <Input placeholder="+1" className="w-24" {...register("phoneCode")} /> 
                   <Input className="flex-1" placeholder="1234567890" {...register("phone", { required: true })} />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>LinkedIn URL *</Label>
                <Input {...register("linkedIn", { required: true })} />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label>Websites</Label>
                {websites.map((site, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input 
                      value={site} 
                      onChange={(e) => {
                        const newSites = [...websites];
                        newSites[index] = e.target.value;
                        setValue("websites", newSites);
                      }} 
                      placeholder="https://" 
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => {
                        const newSites = websites.filter((_, i) => i !== index);
                        setValue("websites", newSites);
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setValue("websites", [...websites, ""])} 
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Website
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2. Eligibility */}
          <Card>
            <CardHeader>
              <CardTitle>2. Eligibility & Legal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="adult" 
                  className="h-4 w-4 rounded border-gray-300" 
                  {...register("isAdult", { required: true })} 
                />
                <Label htmlFor="adult">Are you over 18 years of age? *</Label>
              </div>
              {errors.isAdult && <p className="text-xs text-red-500 mt-1">You must be 18+</p>}
            </CardContent>
          </Card>

          {/* 3. Education */}
          <Card>
            <CardHeader>
              <CardTitle>3. Education Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label>University/Institute Name *</Label>
                 <Autocomplete 
                  options={UNIVERSITIES} 
                  value={watch("university") || ""} 
                  onChange={(val) => setValue("university", val)} 
                  placeholder="Select University"
                />
              </div>
              <div className="space-y-2">
                <Label>Degree *</Label>
                 <Autocomplete 
                  options={DEGREES} 
                  value={watch("degree") || ""} 
                  onChange={(val) => setValue("degree", val)} 
                  placeholder="Select Degree"
                />
              </div>
              <div className="space-y-2">
                <Label>Major/Department *</Label>
                 <Autocomplete 
                  options={MAJORS} 
                  value={watch("major") || ""} 
                  onChange={(val) => setValue("major", val)} 
                  placeholder="Select Major"
                />
              </div>
               <div className="space-y-2">
                <Label>Start Year *</Label>
                <Input type="month" {...register("startYear", { required: true })} />
              </div>
               <div className="space-y-2">
                <Label>Expected Graduation *</Label>
                <Input type="month" {...register("endYear", { required: true })} />
              </div>
               <div className="space-y-2">
                <Label>GPA / CGPA *</Label>
                <Input {...register("gpa", { required: true })} />
              </div>
            </CardContent>
          </Card>

          {/* 4. Resume & 5. Skills */}
          <Card>
            <CardHeader>
               <CardTitle>4. Attachments & Skills</CardTitle>
            </CardHeader>
             <CardContent className="space-y-6">
               <div className="space-y-2">
                 <Label>Upload Resume / CV *</Label>
                 <Input type="file" className="cursor-pointer file:text-primary file:font-semibold hover:file:bg-primary/10" />
               </div>
               
               <div className="space-y-2">
                 <Label>Coding Languages</Label>
                 {/* Logic for multiple coding languages */}
                 {(watch("codingLanguages") || [""]).map((lang, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <div className="flex-1">
                          <Autocomplete 
                            options={["Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust", "Swift", "Kotlin", "PHP", "Ruby"]} 
                            value={lang} 
                            onChange={(val) => {
                               const newLangs = [...(watch("codingLanguages") || [""])];
                               newLangs[index] = val;
                               setValue("codingLanguages", newLangs);
                            }} 
                            placeholder="Select Language"
                          />
                      </div>
                       <Button type="button" variant="ghost" size="icon" onClick={() => {
                          const newLangs = (watch("codingLanguages") || []).filter((_, i) => i !== index);
                          setValue("codingLanguages", newLangs);
                       }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                 ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => setValue("codingLanguages", [...(watch("codingLanguages") || []), ""])}>
                    <Plus className="h-4 w-4 mr-2" /> Add Language
                 </Button>
               </div>

               <div className="space-y-2">
                 <Label>Preferred Areas</Label>
                 {/* Logic for multiple preferred areas */}
                 {(watch("preferredAreas") || [""]).map((area, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input 
                        placeholder="e.g. Frontend, Backend, AI"
                        value={area}
                        onChange={(e) => {
                           const newAreas = [...(watch("preferredAreas") || [""])];
                           newAreas[index] = e.target.value;
                           setValue("preferredAreas", newAreas);
                        }}
                      />
                       <Button type="button" variant="ghost" size="icon" onClick={() => {
                          const newAreas = (watch("preferredAreas") || []).filter((_, i) => i !== index);
                          setValue("preferredAreas", newAreas);
                       }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                 ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => setValue("preferredAreas", [...(watch("preferredAreas") || []), ""])}>
                    <Plus className="h-4 w-4 mr-2" /> Add Area
                 </Button>
               </div>

                <div className="space-y-2">
                 <Label>HackerRank / Codeforces Rating</Label>
                  {/* Logic for multiple assessments */}
                 {(watch("assessments") || [""]).map((score, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input 
                        placeholder="Platform: Score/Link"
                        value={score}
                        onChange={(e) => {
                           const newScores = [...(watch("assessments") || [""])];
                           newScores[index] = e.target.value;
                           setValue("assessments", newScores);
                        }}
                      />
                       <Button type="button" variant="ghost" size="icon" onClick={() => {
                          const newScores = (watch("assessments") || []).filter((_, i) => i !== index);
                          setValue("assessments", newScores);
                       }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                 ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => setValue("assessments", [...(watch("assessments") || []), ""])}>
                    <Plus className="h-4 w-4 mr-2" /> Add Score
                 </Button>
               </div>
             </CardContent>
          </Card>

          <div className="flex justify-end gap-4 sticky bottom-4 bg-background/80 backdrop-blur p-4 border rounded-lg shadow-lg">
            <Button variant="outline" type="button" onClick={() => setLocation('/')}>Cancel</Button>
            <Button type="submit" size="lg">Save Profile</Button>
          </div>
        </form>
      </motion.div>
    </Layout>
  );
}
