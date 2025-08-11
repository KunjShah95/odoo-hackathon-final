import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Switch } from './ui/switch';
import { 
  ArrowLeft, 
  User as UserIcon, 
  Mail, 
  Camera, 
  Save, 
  Trash2, 
  Globe, 
  Shield,
  Bell,
  Plane
} from 'lucide-react';

import type { User as AppUser } from '../types';

interface ProfileScreenProps {
  user: AppUser;
  onUpdateUser: (user: AppUser) => void;
  onLogout: () => void;
}

export default function ProfileScreen({ user, onUpdateUser, onLogout }: ProfileScreenProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    avatar: string;
    currency_preference: 'USD' | 'EUR' | 'INR';
  }>({
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
    currency_preference: user.currency_preference || 'USD',
  });
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    publicProfile: false,
    shareTrips: true,
    marketingEmails: false
  });

  const handleSave = () => {
    onUpdateUser({
      ...user,
      name: formData.name,
      email: formData.email,
      avatar: formData.avatar,
      currency_preference: formData.currency_preference,
    });
    setIsEditing(false);
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Handle account deletion
      onLogout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold">Profile & Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserIcon className="w-5 h-5 mr-2" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Manage your personal information and account settings
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={formData.avatar} alt={formData.name} />
                    <AvatarFallback className="text-xl">
                      {formData.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  {isEditing && (
                    <div className="flex-1">
                      <Label htmlFor="avatar">Profile Photo URL</Label>
                      <Input
                        id="avatar"
                        placeholder="https://example.com/photo.jpg"
                        value={formData.avatar}
                        onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                      />
                    </div>
                  )}
                  
                  {!isEditing && (
                    <div>
                      <Button variant="outline" size="sm">
                        <Camera className="w-4 h-4 mr-2" />
                        Change Photo
                      </Button>
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>

                {/* Currency Preference */}
                <div className="space-y-2">
                  <Label htmlFor="currency_preference">Preferred Currency</Label>
                  <select
                    id="currency_preference"
                    value={formData.currency_preference}
                    onChange={e => setFormData(prev => ({ ...prev, currency_preference: e.target.value as 'USD' | 'EUR' | 'INR' }))}
                    disabled={!isEditing}
                    className="border rounded px-2 py-1"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="INR">INR - Indian Rupee</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  {isEditing ? (
                    <>
                      <Button onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Privacy & Preferences
                </CardTitle>
                <CardDescription>
                  Control how your account and data are used
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive updates about your trips and account</p>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked: boolean) => 
                      setPreferences(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Public Profile</h4>
                    <p className="text-sm text-gray-600">Allow others to find and view your profile</p>
                  </div>
                  <Switch
                    checked={preferences.publicProfile}
                    onCheckedChange={(checked: boolean) => 
                      setPreferences(prev => ({ ...prev, publicProfile: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Share Trips</h4>
                    <p className="text-sm text-gray-600">Allow sharing your trips with others</p>
                  </div>
                  <Switch
                    checked={preferences.shareTrips}
                    onCheckedChange={(checked: boolean) => 
                      setPreferences(prev => ({ ...prev, shareTrips: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Marketing Emails</h4>
                    <p className="text-sm text-gray-600">Receive travel deals and inspiration</p>
                  </div>
                  <Switch
                    checked={preferences.marketingEmails}
                    onCheckedChange={(checked: boolean) => 
                      setPreferences(prev => ({ ...prev, marketingEmails: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/trips')}
                >
                  <Plane className="w-4 h-4 mr-2" />
                  My Trips
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/search/cities')}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Explore Cities
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/create-trip')}
                >
                  <Plane className="w-4 h-4 mr-2" />
                  Plan New Trip
                </Button>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={onLogout}
                >
                  Sign Out
                </Button>
                
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleDeleteAccount}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Your Travel Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Trips Created</span>
                  <span className="font-semibold">5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cities Visited</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Countries Explored</span>
                  <span className="font-semibold">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-semibold">Jan 2024</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}