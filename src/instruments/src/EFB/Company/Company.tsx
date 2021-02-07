import React, {useState} from "react"
import { IconUser } from '@tabler/icons';
import Input from "../Components/Form/Input/Input";

type CompanyProps = {
    simbriefUsername: string,
    changeSimbriefUsername: Function,
}

const Company = (props: CompanyProps) => {
    return (
        <div className="flex p-6 w-full">
            <div className="w-4/12 mr-4">
                <h1 className="text-white font-medium ml-2 mb-4 text-xl">Simbrief</h1>

                <Input
                    label={'Username'}
                    type={'text'}
                    value={props.simbriefUsername}
                    onChange={(value) => props.changeSimbriefUsername(value)}
                    leftComponent={<IconUser color={'white'} size={35} />}
                />
            </div>
        </div>
    )
}

export default Company;
