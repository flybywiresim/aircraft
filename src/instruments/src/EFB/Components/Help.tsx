import { IconHelp } from '@tabler/icons';
import React, { ReactNode } from 'react';

type HelpProps = {
    title: string
};

type HelpState = {
    modalVisible: boolean
};

export default class Help extends React.Component<HelpProps, HelpState> {
    constructor(props: HelpProps) {
        super(props);
        this.state = { modalVisible: false };
    }

    private displayModal = () => {
        this.setState((prevState) => {
            const newState = { ...prevState };

            newState.modalVisible = true;

            return newState;
        });
    }

    private hideModal = () => {
        this.setState((prevState) => {
            const newState = { ...prevState };

            newState.modalVisible = false;

            return newState;
        });
    }

    private modal(): JSX.Element | undefined {
        if (this.state.modalVisible) {
            return (
                <div className="fixed bg-gray-600 rounded-lg flex flex-col top-1/2 left-1/2 w-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                    <a onClick={() => this.hideModal()} className="absolute text-2xl top-3 right-5 cursor-pointer">X</a>
                    <div className="text-center p-5 text-3xl">
                        {this.props.title}
                    </div>
                    <div className="py-5 px-10 flex flex-col justify-center items-center">
                        {this.props.children}
                    </div>
                </div>
            );
        }
        return undefined;
    }

    public render(): ReactNode {
        return (
            <>
                <a onClick={() => this.displayModal()}>
                    <IconHelp className="text-gray-500 hover:text-blue-light" size={25} stroke={1.5} />
                </a>
                {this.modal()}
            </>
        );
    }
}
