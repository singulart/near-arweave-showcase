import "regenerator-runtime/runtime";
import React, { useState, useEffect, useRef } from "react";

// style sheets
import "./global.css";
import "bootstrap/dist/css/bootstrap.min.css";

//import components from react bootstrap

import {
  Form,
  Button,
  Card,
  Container,
  Row,
  Nav,
  Navbar,
  Alert,
} from "react-bootstrap";
import Arweave from "arweave";

// Since v1.5.1 you're now able to call the init function for the web version without options. The current URL path will be used by default. This is recommended when running from a gateway.

import getConfig from "./config";
const { networkId } = getConfig(process.env.NODE_ENV || "development");

export default function App() {
  // state variables
  const [bufferVal, setBuffer] = useState([]);
  const [arweaveKey, setArweaveKey] = useState("");
  const [getImage, setGetImage] = useState("");
  const [transacitonID, setTransactionID] = useState("");

  //references
  const idRef = useRef();

  const arweaveConfig = {
    host: "127.0.0.1",
    port: 1984,
    protocol: "http",
  }

  const arweave = Arweave.init(arweaveConfig);

  useEffect(() => {
    arweave.wallets.generate().then(async (key) => {
      console.log(key);
      setArweaveKey(key); 
      // Mint some coins
      const address1 = await arweave.wallets.jwkToAddress(key);
      await arweave.api.get(`mint/${address1}/200000000000000000`);
    });
  }, []);

  const processPic = (event) => {
    event.preventDefault();
    console.log("event capture...");
    console.log(event);
    // process file for arweave
    console.log(event.target.files);
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      setBuffer(reader.result); // update component state
    };
  };

  const saveToArweave = async () => {
    let data = bufferVal;
    let transaction = await arweave.createTransaction(
      { data: data },
      arweaveKey
    );
    transaction.addTag("Content-Type", "image/png");

    await arweave.transactions.sign(transaction, arweaveKey);

    setTransactionID(transaction.id); // update component state

    console.log("transaction details");

    console.log("I am logging the transaction id", transaction);

    let uploader = await arweave.transactions.getUploader(transaction);

    while (!uploader.isComplete) {
      await uploader.uploadChunk();
      console.log(
        `${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`
      );
      await fetch(`${arweaveConfig.protocol}://${arweaveConfig.host}:${arweaveConfig.port}/mine/666`); //mine 666 blocks to hail the Satan
    }
  };

  const getData = async () => {
    arweave.transactions.getStatus(idRef.current.value).then((res) => {
      console.log(res);
    });

    const result = await arweave.transactions.getData(idRef.current.value, {decode: true});

    setGetImage(URL.createObjectURL(new Blob([result], { type: 'image/png' })));
    console.log(result.length);

  };

  return (
    <React.Fragment>
      <Navbar bg='light' expand='lg'>
        <Container>
          <Navbar.Brand href='#home'>NEAR-Arweave</Navbar.Brand>
          <Navbar.Toggle aria-controls='basic-navbar-nav' />
          <Navbar.Collapse id='basic-navbar-nav'>
            <Nav className='me-auto'>
              <Nav.Link href='https://twitter.com/daomania'>
                @daomania
              </Nav.Link>
              <Nav.Link href='https://github.com/singulart'>My Github</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container>
        <Row
          className='d-flex justify-content-center'
          style={{ marginTop: "10vh" }}
        >
          {" "}
          <Card style={{ width: "50vw", padding: "3vw" }}>
            <Card.Title>Step 1. ArLocal</Card.Title>
            <Card.Body>
              First, open up an additional terminal, one used to run this
              application the other to start your local Arweave Node. Then go to{" "}
              <a href={"https://github.com/textury/arlocal"}>ArLocal Github</a>{" "}
              and set up your local arweave node. You can do this by simply
              running <br></br>
              <Alert> npx arlocal</Alert> <br></br> in your additional terminal
            </Card.Body>
          </Card>
        </Row>

        <Row
          className='d-flex justify-content-center'
          style={{ marginTop: "3vh" }}
        >
          <Card style={{ width: "50vw", padding: "3vw" }}>
            <Card.Title>Step 2.</Card.Title>
            <Form.Group controlId='formFile' className='mb-3'>
              <Form.Label>Choose a .png file from your computer</Form.Label>
              <Form.Control onChange={processPic} type='file' />
            </Form.Group>
            <Button onClick={saveToArweave}>Submit</Button>
            <br></br>
            <Card.Header>Transaction ID</Card.Header>
            <Alert>{transacitonID}</Alert>
          </Card>
        </Row>

        <Row className='d-flex justify-content-center'>
          <Card style={{ width: "50vw", padding: "3vw", marginTop: "3vh" }}>
            <Card.Title>Step 3! Mint NFT</Card.Title>
            <Card.Body>
              <Card.Header>Enter the Following in Your Terminal</Card.Header>
              <Alert>ID=your-testnet-account-name.testnet</Alert>
              <Alert>TITLE={`<name you want to give your NFT>`}</Alert>
              <Alert>
                ARWEAVEID={`<The TransactionID given to you above>`}
              </Alert>
              <Alert>
                {`near call example-nft.testnet nft_mint '{"token_id": "'$ARWEAVEID'", "receiver_id": "'$ID'", "token_metadata": { "title": "'$TITLE'", "description": "My NFT media", "copies": 1}}' --accountId $ID --deposit 0.1`}
              </Alert>{" "}
            </Card.Body>
          </Card>
        </Row>

        <Row className='d-flex justify-content-center'>
          <Card style={{ width: "50vw", padding: "3vw", marginTop: "3vh" }}>
            <Card.Title>Step 4! Get List of Minted Tokens</Card.Title>
            <Card.Body>
              <Card.Header>Enter the Following in Your Terminal</Card.Header>
              <Alert>{`near view example-nft.testnet nft_tokens_for_owner '{"account_id": "'$ID'"}'`}</Alert>
            </Card.Body>
          </Card>
        </Row>

        <Row
          className='d-flex justify-content-center'
          style={{ marginTop: "10vh" }}
        >
          <Card style={{ width: "=50vw", marginBottom: "10vh" }}>
            <Card.Title> Step 5! Retrieve Image with ID</Card.Title>
            <Container>
              <Row>
                {" "}
                <Form.Group className='mb-3' controlId='formBasicEmail'>
                  <Form.Label>Enter Transaction ID</Form.Label>
                  <Form.Control ref={idRef} type='' placeholder='Enter ID' />
                </Form.Group>
              </Row>
              <Row className='justify-content-center d-flex'>
                {" "}
                <Button
                  style={{ marginBottom: "3vh", width: "30vw" }}
                  onClick={getData}
                >
                  Get Data
                </Button>
              </Row>
              <Row className='d-flex justify-content-center'>
                <img style={{ width: "40vw" }} src={getImage} />
              </Row>
            </Container>
          </Card>
        </Row>
      </Container>
    </React.Fragment>
  );
}
