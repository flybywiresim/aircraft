import React, {useState} from "react"

type CompanyProps = {
    simbriefUsername: string,
    changeSimbriefUsername: Function,
}

const Company = (props: CompanyProps) => {
    return (
        <div className="flex p-6 w-full">
            <div className="w-4/12 mr-4">
                <h1 className="text-white font-medium ml-2 mb-4 text-xl">Simbrief</h1>
                <input
                    className="text-2xl font-medium rounded-lg"
                    type="text"
                    placeholder="Insert Username"
                    value={props.simbriefUsername}
                    onChange={(event) => props.changeSimbriefUsername(event.target.value)} />
            </div>
        </div>
    )
}

export default Company;
