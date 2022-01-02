import React, { useState, useEffect, memo } from "react";
import { Header } from '@buffetjs/custom';
import styled from "styled-components";
import { Button } from '@buffetjs/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Table } from "@buffetjs/core";
import axios from "axios";
import initFacebookSDK from "./initFacebookSDK";

const Wrapper = styled.div`
  padding: 18px 30px;
  p {
    margin-top: 1rem;
  }
`;

initFacebookSDK().then(HomePage);

const HomePage = () => {
  const [rows, setRows] = useState([]);
  const [facebookUserAccessToken, setFacebookUserAccessToken] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:1337/platforms")
      .then((res) => setRows(res.data))
      .catch((e) => strapi.notification.error(`Ops... API error, ${e}`));
  })

  useEffect(() => {
    window.FB.getLoginStatus((response) => {
      setFacebookUserAccessToken(response.authResponse?.accessToken);
    });
  }, []);

  const headers = [
    {
      name: "Id",
      value: "id",
    },
    {
      name: "Name",
      value: "name",
    },
    {
      name: "slug",
      value: "slug",
    },
  ];
  return <Wrapper>
    <Header
      title={{ label: 'Profiles'}}
      content="Profiles Description"/>
    
    <Table headers={headers} rows={rows} />
    
    <div>
       <Button color="primary" icon={<FontAwesomeIcon icon={faPlus} />} label="Log In" />
    </div>
  </Wrapper>
  
};

export default memo(HomePage);