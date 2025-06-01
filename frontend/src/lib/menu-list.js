import { CheckSquare, FolderOpen, LayoutGrid, Settings, Users } from "lucide-react";

export function getMenuList(pathname) {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutGrid,
          submenus: []
        }
      ]
    },
    {
      groupLabel: "Solutions",
      menus: [
        {
          href: "",
          label: "Projects",
          icon: FolderOpen,
          submenus: [
            {
              href: "/solutions/projects",
              label: "All Projects"
            },
            {
              href: "/solutions/projects/create",
              label: "Create Project"
            }
          ]
        },
        {
          href: "",
          label: "Tasks",
          icon: CheckSquare,
          submenus: [
            {
              href: "/solutions/tasks",
              label: "All Tasks"
            },
            {
              href: "/solutions/tasks/create",
              label: "Create Task"
            }
          ]
        }
      ]
    },
    {
      groupLabel: "Account",
      menus: [
        {
          href: "/profile",
          label: "Profile",
          icon: Users
        },
        {
          href: "/settings",
          label: "Settings",
          icon: Settings
        }
      ]
    }
  ];
}
