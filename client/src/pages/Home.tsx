import { Link } from "wouter";
import { useProjects, useGenerateVideo, useDeleteProject } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { CreateProjectModal } from "@/components/CreateProjectModal";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Music, Calendar, Clock, Loader2, ArrowRight, RefreshCw, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { data: projects, isLoading, error } = useProjects();
  const { mutate: retryGenerate } = useGenerateVideo();
  const { mutate: deleteProject } = useDeleteProject();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
        <div className="bg-destructive/10 p-4 rounded-full mb-4">
          <Music className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold mb-2">Failed to load projects</h1>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid-pattern relative overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="fixed top-0 left-0 w-full h-[50vh] bg-primary/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Tunivo Studio
            </h1>
            <p className="text-lg text-muted-foreground">
              Turn music into motion.
            </p>
          </div>
          
          <CreateProjectModal>
            <Button className="bg-white text-black px-8 py-6 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.2)]" data-testid="button-new-project">
              <Plus className="w-5 h-5 mr-2" />
              New Project
            </Button>
          </CreateProjectModal>
        </div>

        {projects?.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
              <Music className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-3">No projects yet</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Upload your first track and Tunivo will create visuals for as long as it plays.
            </p>
            <CreateProjectModal>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Start Creating
              </Button>
            </CreateProjectModal>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects?.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <div className="group relative bg-card/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-primary/50 hover:bg-card/60 transition-all duration-300 cursor-pointer overflow-hidden" data-testid={`card-project-${project.id}`}>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Music className="w-6 h-6 text-primary" />
                    </div>
                    <StatusBadge status={project.status} />
                  </div>

                  <h3 className="text-xl font-bold font-display mb-2 truncate pr-4 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-6 h-10">
                    {project.prompt}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-white/5 pt-4">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {project.createdAt && formatDistanceToNow(new Date(project.createdAt))} ago
                      </span>
                      {project.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.floor(project.duration / 60)}:{(project.duration % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    {project.status === 'failed' ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            retryGenerate(project.id, {
                              onSuccess: () => toast({ title: "Retrying", description: "Generation restarted." }),
                              onError: () => toast({ title: "Error", description: "Could not retry.", variant: "destructive" }),
                            });
                          }}
                          data-testid={`button-retry-${project.id}`}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteProject(project.id, {
                              onSuccess: () => toast({ title: "Deleted", description: "Project removed." }),
                            });
                          }}
                          data-testid={`button-delete-${project.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
