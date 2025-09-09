import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Brain, 
  Key, 
  FileText, 
  LogOut, 
  User, 
  X,
  Bell,
  Download,
  Settings as SettingsIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const moreMenuItems = [
  {
    title: "Stock Movement",
    url: "/stock-movement",
    icon: TrendingUp,
    roles: ['admin', 'superadmin']
  },
  {
    title: "Stock Reports", 
    url: "/stock-report",
    icon: FileText,
    roles: ['admin', 'superadmin']
  },
  {
    title: "Generate Report",
    url: "/stock-report?generate=true", 
    icon: Download,
    roles: ['user', 'admin', 'superadmin']
  },
  {
    title: "Alerts",
    url: "/alerts", 
    icon: Bell,
    roles: ['user', 'admin', 'superadmin']
  },
  {
    title: "Users",
    url: "/users", 
    icon: Users,
    roles: ['admin', 'superadmin']
  },
  {
    title: "AI Studio",
    url: "/ai-studio",
    icon: Brain,
    roles: ['admin', 'superadmin']
  },
  {
    title: "API Management",
    url: "/api-management",
    icon: Key,
    roles: ['superadmin']
  },
  {
    title: "Settings",
    url: "/settings",
    icon: SettingsIcon,
    roles: ['user', 'admin', 'superadmin']
  }
];

interface MobileMoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMoreMenu({ isOpen, onClose }: MobileMoreMenuProps) {
  const { user, logout } = useAuth();

  const filteredItems = moreMenuItems.filter(item => 
    item.roles.includes(user?.role || 'user')
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-destructive';
      case 'admin':
        return 'bg-warning';
      default:
        return 'bg-success';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      default:
        return 'User';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      
      <motion.div
        className="fixed bottom-16 left-0 right-0 z-50 bg-card border-t border-border/50 rounded-t-3xl shadow-strong"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="mobile-text-small md:text-lg font-semibold">Menu</h3>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
              <X className="w-3 h-3" />
            </Button>
          </div>

          {/* User Profile Section */}
          <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-xl mb-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground mobile-text-tiny">
                <User className="w-3 h-3" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="mobile-text-small font-medium truncate">{user?.name}</p>
              <Badge variant="secondary" className={`mobile-text-tiny ${getRoleBadgeColor(user?.role || '')}`}>
                {getRoleLabel(user?.role || '')}
              </Badge>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-0.5 mb-3">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.title}
                  to={item.url}
                  onClick={onClose}
                  className="flex items-center space-x-2 p-2 rounded-xl mobile-text-small font-medium transition-colors hover:bg-muted/50"
                >
                  <Icon className="w-3 h-3 text-muted-foreground" />
                  <span>{item.title}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Logout Button */}
          <Button
            variant="outline"
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5 h-8 mobile-text-small"
          >
            <LogOut className="w-3 h-3 mr-2" />
            Logout
          </Button>
        </div>
      </motion.div>
    </>
  );
}