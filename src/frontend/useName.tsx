import { useState } from "react";
import type {InputName } from "./type"

function staffName(){
    const [staff, setName]=useState("");
    const inputName =(e:InputName)=>{
        setName(e.target.value);
    }

    return(
        {staff, inputName}        
    )
};

export default staffName;
