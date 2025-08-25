import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pet-green to-pet-blue flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white rounded-3xl shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-pet-orange rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-paw text-white text-3xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">PawTracker</h1>
            <p className="text-gray-600">Family Dog Activity Logger</p>
          </div>
          
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Track your dog's activities together
              </h2>
              <p className="text-gray-600 mb-6">
                Log walks, bathroom breaks, and feeding times as a family
              </p>
            </div>
            
            <Button 
              onClick={handleLogin}
              className="w-full bg-pet-green hover:bg-pet-green/90 text-white rounded-2xl py-6 text-lg font-semibold"
              data-testid="button-login"
            >
              Sign In with Replit
            </Button>
            
            <div className="text-center">
              <p className="text-xs text-gray-500">Secured with Replit Auth</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
