import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import BottomNav from "@/components/bottom-nav";
import type { Dog, InsertDog } from "@shared/schema";

export default function Profile() {
  const { user, isLoading: userLoading } = useAuth();
  const { logout } = useAuthContext();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [dogName, setDogName] = useState("");
  const [dogBreed, setDogBreed] = useState("");
  const [dogPhotoUrl, setDogPhotoUrl] = useState("");
  const [dogWeight, setDogWeight] = useState("");

  // No need to redirect if not authenticated - the App component handles this
  // Removed the old auth check that redirected to /api/login

  // Fetch dog profile
  const { data: dogProfile, isLoading: dogLoading } = useQuery({
    queryKey: ["/api/dogs/profile"],
    enabled: !!user,
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/dogs/profile");
      if (!response.ok) throw new Error("Failed to fetch dog profile");
      return response.json() as Promise<Dog | null>;
    },
  });

  // Update form values when dog profile loads
  useEffect(() => {
    if (dogProfile) {
      setDogName(dogProfile.name || "");
      setDogBreed(dogProfile.breed || "");
      setDogPhotoUrl(dogProfile.photoUrl || "");
      setDogWeight(dogProfile.weight?.toString() || "");
    }
  }, [dogProfile]);

  // Save dog profile mutation
  const saveDogMutation = useMutation({
    mutationFn: async () => {
      const dogData: InsertDog = {
        userId: (user as any).id,
        name: dogName.trim(),
        breed: dogBreed.trim(),
        photoUrl: dogPhotoUrl.trim() || undefined,
        weight: dogWeight ? parseInt(dogWeight) : undefined,
      };

      if (dogProfile) {
        await apiRequest("PUT", `/api/dogs/${dogProfile.id}`, dogData);
      } else {
        await apiRequest("POST", "/api/dogs", dogData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dogs/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({
        title: "Profile Updated!",
        description: "Your dog's profile has been saved.",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save dog profile",
        variant: "destructive",
      });
    },
  });

  const getUserName = (user: any) => {
    if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`;
    if (user?.firstName) return user.firstName;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserInitial = (user: any) => {
    if (user?.firstName) return user.firstName[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'U';
  };

  const getUserColor = (userId: string) => {
    const colors = ['bg-pet-green', 'bg-pet-blue', 'bg-pet-orange', 'bg-pet-purple'];
    const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handleSave = () => {
    if (!dogName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your dog's name",
        variant: "destructive",
      });
      return;
    }
    saveDogMutation.mutate();
  };

  const handleCancel = () => {
    if (dogProfile) {
      setDogName(dogProfile.name || "");
      setDogBreed(dogProfile.breed || "");
      setDogPhotoUrl(dogProfile.photoUrl || "");
      setDogWeight(dogProfile.weight?.toString() || "");
    }
    setIsEditing(false);
  };

  if (userLoading || dogLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pet-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800">Profile</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              data-testid="button-logout"
            >
              <i className="fas fa-sign-out-alt text-xl text-gray-600"></i>
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* User Profile Card */}
        <Card className="bg-white rounded-3xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 ${getUserColor((user as any).id)} rounded-full flex items-center justify-center`}>
                <span className="text-white text-xl font-semibold" data-testid="text-user-initial">
                  {getUserInitial(user)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800" data-testid="text-user-name">
                  {getUserName(user)}
                </h2>
                <p className="text-gray-600" data-testid="text-user-email">
                  {(user as any).email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dog Profile Card */}
        <Card className="bg-white rounded-3xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Dog Profile</h3>
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-pet-green hover:bg-pet-green/90 text-white rounded-xl px-4 py-2"
                  data-testid="button-edit-profile"
                >
                  <i className="fas fa-edit text-sm mr-2"></i>
                  Edit
                </Button>
              ) : null}
            </div>

            {!isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {dogProfile?.photoUrl || dogPhotoUrl ? (
                    <img 
                      src={dogProfile?.photoUrl || dogPhotoUrl} 
                      alt={`${dogProfile?.name || dogName} photo`} 
                      className="w-20 h-20 rounded-full object-cover border-4 border-pet-orange"
                      data-testid="img-dog-photo"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-pet-orange bg-opacity-20 rounded-full flex items-center justify-center">
                      <i className="fas fa-dog text-pet-orange text-2xl"></i>
                    </div>
                  )}
                  <div>
                    <h4 className="text-xl font-bold text-gray-800" data-testid="text-dog-name">
                      {dogProfile?.name || "Add your dog's name"}
                    </h4>
                    <p className="text-gray-600" data-testid="text-dog-breed">
                      {dogProfile?.breed || "Add breed"}
                    </p>
                    {dogProfile?.weight && (
                      <p className="text-sm text-gray-500" data-testid="text-dog-weight">
                        {dogProfile.weight} lbs
                      </p>
                    )}
                  </div>
                </div>

                {!dogProfile && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-dog text-gray-400 text-2xl"></i>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2">Add Your Dog's Profile</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Share your furry friend's details with the family
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dog-photo" className="text-sm font-medium text-gray-700 mb-2 block">
                    Dog Photo (Optional)
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="dog-photo"
                      type="url"
                      value={dogPhotoUrl}
                      onChange={(e) => setDogPhotoUrl(e.target.value)}
                      placeholder="https://example.com/your-dog-photo.jpg"
                      className="w-full rounded-xl border-gray-300"
                      data-testid="input-dog-photo"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      id="dog-photo-upload"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('file', file);
                        try {
                          const res = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData,
                          });
                          const data = await res.json();
                          if (data.url) setDogPhotoUrl(data.url);
                          else alert('Upload failed');
                        } catch {
                          alert('Upload failed');
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('dog-photo-upload')?.click()}
                    >
                      Välj bild
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Ladda upp en bild från din telefon eller klistra in en URL
                  </p>
                </div>

                <div>
                  <Label htmlFor="dog-name" className="text-sm font-medium text-gray-700 mb-2 block">
                    Dog Name *
                  </Label>
                  <Input
                    id="dog-name"
                    type="text"
                    value={dogName}
                    onChange={(e) => setDogName(e.target.value)}
                    placeholder="Enter your dog's name"
                    className="w-full rounded-xl border-gray-300"
                    data-testid="input-dog-name"
                  />
                </div>

                <div>
                  <Label htmlFor="dog-breed" className="text-sm font-medium text-gray-700 mb-2 block">
                    Breed (Optional)
                  </Label>
                  <Input
                    id="dog-breed"
                    type="text"
                    value={dogBreed}
                    onChange={(e) => setDogBreed(e.target.value)}
                    placeholder="e.g., Golden Retriever, Mixed"
                    className="w-full rounded-xl border-gray-300"
                    data-testid="input-dog-breed"
                  />
                </div>

                <div>
                  <Label htmlFor="dog-weight" className="text-sm font-medium text-gray-700 mb-2 block">
                    Weight (lbs, Optional)
                  </Label>
                  <Input
                    id="dog-weight"
                    type="number"
                    value={dogWeight}
                    onChange={(e) => setDogWeight(e.target.value)}
                    placeholder="Weight in pounds"
                    className="w-full rounded-xl border-gray-300"
                    data-testid="input-dog-weight"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={saveDogMutation.isPending}
                    className="flex-1 bg-pet-green hover:bg-pet-green/90 text-white rounded-xl py-3"
                    data-testid="button-save-dog-profile"
                  >
                    {saveDogMutation.isPending ? 'Saving...' : 'Save Profile'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1 rounded-xl py-3 border-gray-300"
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Tips Card */}
        <Card className="bg-white rounded-3xl shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tips</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-pet-blue bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <i className="fas fa-camera text-pet-blue text-xs"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Upload Photos</p>
                  <p className="text-xs text-gray-500">
                    Use services like Imgur, Google Photos, or Dropbox to host your dog's photo
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-pet-orange bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <i className="fas fa-users text-pet-orange text-xs"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Family Sharing</p>
                  <p className="text-xs text-gray-500">
                    Each family member can add their own dog profile for multiple pets
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav currentPage="profile" />
    </div>
  );
}