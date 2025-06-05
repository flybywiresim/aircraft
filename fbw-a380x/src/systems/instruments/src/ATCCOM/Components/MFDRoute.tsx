import React, { FC } from 'react';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

type MFDRouteProps = {
  path: string;
  exact?: boolean;
  component?: any;
};

export const MFDRoute: FC<MFDRouteProps> = ({ path, exact, component, children }) => {
  const { path: route } = useRouteMatch();
  return (
    <Route path={route + path} exact={exact} component={component}>
      {children}
    </Route>
  );
};

type MFDRedirectProps = {
  to: string;
};

export const MFDRedirect: FC<MFDRedirectProps> = ({ to }) => {
  const { path } = useRouteMatch();
  return <Redirect to={path + to.substr(1)} />;
};
