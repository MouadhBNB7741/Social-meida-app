import { useParams } from "react-router-dom";

const Messenger = () => {
  const { id } = useParams();
  return <div>you name is {`${id}`}</div>;
};

export default Messenger;
