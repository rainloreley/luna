import React from 'react';
import SidebarComponent from "../components/sidebar/sidebar_component";
import MusicLibraryView from "./views/musicLibraryView";
import Sidebar_ViewWrapper from "../components/sidebar/sidebar_viewWrapper";

function Home() {
  return (
      <div className={"flex centerView"}>
          <SidebarComponent />
          <Sidebar_ViewWrapper title={"Bibliothek"}>
              <MusicLibraryView />
          </Sidebar_ViewWrapper>
      </div>
  );
}

export default Home;
