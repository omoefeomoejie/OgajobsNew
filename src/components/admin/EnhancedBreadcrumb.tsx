import React, { useState } from 'react';
import { ChevronDown, Home, MoreHorizontal } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Enhanced navigation structure to support unlimited depth
export interface BreadcrumbPath {
  key: string;
  title: string;
  shortTitle?: string; // For mobile responsive design
  description?: string; // For ARIA descriptions
  icon?: React.ComponentType<any>;
  children?: BreadcrumbPath[];
}

interface EnhancedBreadcrumbProps {
  navigationPath: BreadcrumbPath[];
  onNavigate: (path: string[]) => void;
  maxItems?: number; // For responsive collapsing
  showHomeButton?: boolean;
  showQuickNav?: boolean; // Dropdown for quick section switching
  className?: string;
}

export function EnhancedBreadcrumb({
  navigationPath,
  onNavigate,
  maxItems = 3,
  showHomeButton = true,
  showQuickNav = false,
  className,
}: EnhancedBreadcrumbProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle navigation with smooth transitions
  const handleNavigation = async (targetPath: string[]) => {
    setIsTransitioning(true);
    
    // Announce navigation for screen readers
    const announcement = `Navigating to ${targetPath[targetPath.length - 1]}`;
    const ariaLive = document.createElement('div');
    ariaLive.setAttribute('aria-live', 'polite');
    ariaLive.setAttribute('aria-atomic', 'true');
    ariaLive.className = 'sr-only';
    ariaLive.textContent = announcement;
    document.body.appendChild(ariaLive);
    
    setTimeout(() => {
      document.body.removeChild(ariaLive);
    }, 1000);

    // Small delay for smooth animation
    setTimeout(() => {
      onNavigate(targetPath);
      setIsTransitioning(false);
    }, 150);
  };

  // Build path array for current location
  const buildPathArray = (): string[] => {
    return navigationPath.map(p => p.key);
  };

  // Get collapsible items for responsive design
  const getCollapsibleItems = () => {
    if (navigationPath.length <= maxItems) {
      return { visible: navigationPath, hidden: [] };
    }

    const visible = [
      navigationPath[0], // Always show root
      ...navigationPath.slice(-2) // Show last 2 items
    ];
    const hidden = navigationPath.slice(1, -2);
    
    return { visible, hidden };
  };

  const { visible, hidden } = getCollapsibleItems();

  // Quick navigation options (all available sections)
  const quickNavOptions: BreadcrumbPath[] = [
    { key: 'control', title: 'Mission Control', icon: Home },
    { key: 'users', title: 'User Queue' },
    { key: 'bookings', title: 'Booking Control' },
    { key: 'disputes', title: 'Disputes' },
    { key: 'finance', title: 'Financial Hub' },
    { key: 'health', title: 'System Health' },
    { key: 'analytics', title: 'Analytics' },
  ];

  return (
    <div 
      className={cn(
        "mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
        "animate-fade-in",
        isTransitioning && "opacity-50 transition-opacity",
        className
      )}
      role="navigation"
      aria-label="Admin dashboard navigation breadcrumb"
    >
      <div className="flex items-center min-w-0 flex-1">
        <Breadcrumb>
          <BreadcrumbList className="flex-wrap">
            {/* Home button */}
            {showHomeButton && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => handleNavigation(['control'])}
                    className={cn(
                      "cursor-pointer transition-all duration-200",
                      "hover:text-primary hover:scale-105",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      "animate-breadcrumb-enter"
                    )}
                    aria-label="Navigate to admin dashboard home"
                  >
                    <Home className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:ml-2">
                      Dashboard
                    </span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {visible.length > 0 && <BreadcrumbSeparator />}
              </>
            )}

            {/* Render visible breadcrumb items */}
            {visible.map((item, index) => {
              const isLast = index === visible.length - 1;
              const pathToItem = buildPathArray().slice(0, navigationPath.indexOf(item) + 1);

              return (
                <React.Fragment key={item.key}>
                  {/* Show ellipsis if there are hidden items */}
                  {index === 1 && hidden.length > 0 && (
                    <>
                      <BreadcrumbItem>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-1 hover:bg-muted"
                              aria-label={`Show ${hidden.length} hidden breadcrumb items`}
                            >
                              <BreadcrumbEllipsis className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {hidden.map((hiddenItem) => (
                              <DropdownMenuItem
                                key={hiddenItem.key}
                                onClick={() => {
                                  const hiddenPath = buildPathArray().slice(0, navigationPath.indexOf(hiddenItem) + 1);
                                  handleNavigation(hiddenPath);
                                }}
                                className="cursor-pointer"
                              >
                                {hiddenItem.icon && <hiddenItem.icon className="mr-2 h-4 w-4" />}
                                {hiddenItem.title}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                    </>
                  )}

                  <BreadcrumbItem 
                    className="animate-slide-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {isLast ? (
                      <BreadcrumbPage 
                        className="font-medium text-foreground max-w-[150px] sm:max-w-none truncate"
                        title={item.description || item.title}
                      >
                        <span className="flex items-center gap-2">
                          {item.icon && <item.icon className="h-4 w-4 hidden sm:block" />}
                          <span className="sm:hidden">{item.shortTitle || item.title}</span>
                          <span className="hidden sm:inline">{item.title}</span>
                        </span>
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        onClick={() => handleNavigation(pathToItem)}
                        className={cn(
                          "cursor-pointer transition-all duration-200 max-w-[120px] sm:max-w-none truncate",
                          "hover:text-primary hover:scale-105",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        )}
                        title={item.description || item.title}
                        aria-label={`Navigate to ${item.title}`}
                      >
                        <span className="flex items-center gap-2">
                          {item.icon && <item.icon className="h-4 w-4 hidden sm:block" />}
                          <span className="sm:hidden">{item.shortTitle || item.title}</span>
                          <span className="hidden sm:inline">{item.title}</span>
                        </span>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  
                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Quick navigation dropdown for mobile and efficiency */}
      {showQuickNav && (
        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2"
                aria-label="Quick navigation menu"
              >
                <span className="hidden sm:inline">Quick Nav</span>
                <span className="sm:hidden">Nav</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {quickNavOptions.map((option) => (
                <DropdownMenuItem
                  key={option.key}
                  onClick={() => handleNavigation([option.key])}
                  className="cursor-pointer"
                  disabled={navigationPath[navigationPath.length - 1]?.key === option.key}
                >
                  {option.icon && <option.icon className="mr-2 h-4 w-4" />}
                  {option.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

// Helper function to build navigation path from section key
export function buildNavigationPath(activeSection: string, subSection?: string): BreadcrumbPath[] {
  const sectionMap: Record<string, BreadcrumbPath> = {
    control: { 
      key: 'control', 
      title: 'Mission Control', 
      shortTitle: 'Control',
      description: 'Main admin dashboard with system overview and critical alerts',
      icon: Home 
    },
    users: { 
      key: 'users', 
      title: 'User Queue', 
      shortTitle: 'Users',
      description: 'Manage user verification and account status' 
    },
    bookings: { 
      key: 'bookings', 
      title: 'Booking Control', 
      shortTitle: 'Bookings',
      description: 'Monitor and manage service bookings' 
    },
    disputes: { 
      key: 'disputes', 
      title: 'Disputes', 
      shortTitle: 'Disputes',
      description: 'Handle customer disputes and resolutions' 
    },
    finance: { 
      key: 'finance', 
      title: 'Financial Hub', 
      shortTitle: 'Finance',
      description: 'Financial reporting and payment management' 
    },
    health: { 
      key: 'health', 
      title: 'System Health', 
      shortTitle: 'Health',
      description: 'Monitor system performance and health metrics' 
    },
    analytics: { 
      key: 'analytics', 
      title: 'Analytics', 
      shortTitle: 'Analytics',
      description: 'View platform analytics and insights',
      children: [
        { key: 'overview', title: 'Overview', shortTitle: 'Overview' },
        { key: 'users', title: 'User Analytics', shortTitle: 'Users' },
        { key: 'revenue', title: 'Revenue Analytics', shortTitle: 'Revenue' },
      ]
    },
  };

  const path: BreadcrumbPath[] = [];
  
  if (sectionMap[activeSection]) {
    path.push(sectionMap[activeSection]);
    
    // Add sub-section if provided and exists
    if (subSection && sectionMap[activeSection].children) {
      const subSectionItem = sectionMap[activeSection].children?.find(c => c.key === subSection);
      if (subSectionItem) {
        path.push(subSectionItem);
      }
    }
  }

  return path;
}