import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../../components/ui/sidebar'
import { FilePlus2, FileSpreadsheet } from 'lucide-react'
import { logo } from "@/assets/images/image";

const items = [
    {
      title: "Home",
      url: "/nota/frontend/",
      icon: FileSpreadsheet,
    },
    {
      title: "Add Nota",
      url: "/nota/frontend/tambah-nota",
      icon: FilePlus2,
    },
]

export default function AppSidebar() {
  return (    
    <Sidebar>
        <SidebarContent>
         <SidebarGroup>
           <SidebarGroupLabel className="pt-10 pb-20"><img src={logo} alt="Logo" /></SidebarGroupLabel>
             <SidebarGroupContent>
               <SidebarMenu className='space-y-2 ml-[0.5rem]'>
                 {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon className="icon"/>
                        <span className="text-stone-700 text-[1rem]">{item.title}</span>
                      </a> 
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                 ))}
                </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
    </Sidebar>
  )
}
