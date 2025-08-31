import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/contexts/AuthContext";

export default function Landing() {
  const [username, setUsername] = useState("");
  const { login } = useAuthContext();

  const handleLogin = () => {
    if (username.trim()) {
      login(username.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
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
            
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Enter your name or nickname"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className="rounded-2xl py-3 text-center"
                data-testid="input-username"
              />
              
              <Button 
                onClick={handleLogin}
                disabled={!username.trim()}
                className="w-full bg-pet-green hover:bg-pet-green/90 text-white rounded-2xl py-6 text-lg font-semibold disabled:opacity-50"
                data-testid="button-login"
              >
                Start Tracking
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-gray-500">Enter any name to continue</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
