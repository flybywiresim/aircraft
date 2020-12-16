import React from 'react';

type ProfileProps = {
    simbriefUsername: string,
    changeSimbriefUsername: (event: React.ChangeEvent<HTMLInputElement>) => void,
}

type SidebarWidgetProps = {
    simbriefUsername: string,
    changeSimbriefUsername: (event: React.ChangeEvent<HTMLInputElement>) => void,
}

class Profile extends React.Component<ProfileProps, any> {
    render() {
        return (
            <div className="ProfileWidgets">
                <SidebarWidget simbriefUsername={this.props.simbriefUsername} changeSimbriefUsername={this.props.changeSimbriefUsername} />
            </div>
        );
    }
}

const SidebarWidget = (props: SidebarWidgetProps) => {
    return (
        <div className="SidebarWidget">
            <p className="WidgetTitle">Profile</p>
            <div id="Panel">
                <div id="UserIcon">
                    <img src="logo192.png" alt="" />
                </div>
                <div className="ProfileUser">
                    <input value={props.simbriefUsername} type="text" placeholder="Insert Username" onChange={props.changeSimbriefUsername} id="DisplayName" />
                </div>
            </div>
        </div>
    );
};

export default Profile;
