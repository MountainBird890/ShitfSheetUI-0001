import useData from "../state/useShift"

export default function DeleteButton(){
    const deleteRow = (key: string|number) =>{
        useData.setData(data.filter(item => item.key !==key));
    }
}
