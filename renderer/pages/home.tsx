import React, {useContext, useState} from 'react';
import SidebarComponent from "../components/sidebar/sidebar_component";
import MusicLibraryView from "./views/musicLibraryView";
import Sidebar_ViewWrapper from "../components/sidebar/sidebar_viewWrapper";
import {AppControlContext} from "../components/appContextProvider";
import PlaylistView from "./views/playlistView";

function Home() {

    const [selectedItem, setSelectedItem] = useState<string>("library");
    const {libraryManager} = useContext(AppControlContext);

  return (
      <div className={"flex centerView"}>
          <SidebarComponent selectItem={(uid) => {
              setSelectedItem(uid);
          }} />
          {selectedItem == "library" ? (
              <Sidebar_ViewWrapper title={"Bibliothek"}>
                  <MusicLibraryView />
              </Sidebar_ViewWrapper>
          ) : (
              <Sidebar_ViewWrapper title={libraryManager.playlists.find((e) => e.uid == selectedItem).name}>
                  <PlaylistView playlistUID={selectedItem} key={selectedItem} />
              </Sidebar_ViewWrapper>
          )}
      </div>
  );
}

export default Home;
