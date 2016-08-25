import io from 'socket.io';
import {ObjectID} from 'mongodb';
import {socketConnect, socketDisconnect, clientToServer} from '../shared/actions/actions'

export const socketServer = (server, options) => io(server, {});

export const socketStore = (serverSocket, store) => {
  serverSocket.on('connect', (socket) => {
    //console.log('server:connect');
    store.dispatch(socketConnect(socket.id, socket));

    socket.emit('connectionId', socket.id);

    socket.on('disconnect', (reason) => {
      //console.log('server:disconnect', reason);
      store.dispatch(socketDisconnect(socket.id, reason));
    });

    socket.on('action', (action) => {
      //console.log('Server:Receive', action.type);
      if (!clientToServer.$unprotected) {

      }
      if (clientToServer[action.type]) {
        //console.log('action.meta', action.meta)
        store.dispatch(clientToServer[action.type](action.data, {
          connectionId: socket.id
          , ...action.meta
        }));
      } else {
        console.warn('clientToServer action doesnt exist: ' + action.type);
      }
    });
  });
};

export const socketMiddleware = io => store => next => action => {
  const state = store.getState();
  const stateConnections = state.get('connections');
  const stateUsers = state.get('users');
  const nextResult = next(action);
  //console.log(`Server:Prepare:${action.type}`, action.meta);
  if (action.meta) {
    let sockets = [];
    if (Array.isArray(action.meta.users)) {
      sockets = action.meta.users
        .map(userId => stateUsers.get(userId))
        .map(user => user.connectionId);
    } else if (action.meta.users === true) {
      sockets = stateUsers.toArray()
        .map(user => user.connectionId);
    } else if (Array.isArray(action.meta.clients)) {
      sockets = action.meta.clients;
    } else if (action.meta.clients === true) {
      sockets = stateConnections.toArray();
    } else if (action.meta.userId) {
      sockets = [store.getState().getIn(['users', action.meta.userId, 'connectionId'])];
    } else {
      console.error('Meta not valid', action.type, action.meta);
    }
    //console.log('Server:Send', action.type, action.meta, sockets);
    sockets
      .filter(connectionId => stateConnections.has(connectionId))
      .map(connectionId => stateConnections.get(connectionId))
      .forEach((clientSocket) => clientSocket.emit('action', action));
  }
  return nextResult;
};