import {Map, List} from 'immutable';

import {
  gameDeployTraitRequest
  , gameDeployAnimalRequest
  , gameEndTurnRequest
  , traitTakeFoodRequest
  , traitActivateRequest
  , SOCKET_DISCONNECT_NOW
} from '../actions';

import {PHASE} from '../../../shared/models/game/GameModel';

import {makeGameActionHelpers} from '../generic';
import {makeGameSelectors} from '../../selectors';

describe('Game (LEAVERS):', function () {
  it('Deploy, User1 leaves at User0 turn', () => {
    const [{serverStore, ServerGame, ParseGame}
      , {clientStore0, User0, ClientGame0}
      , {clientStore1, User1, ClientGame1}
      , {clientStore2, User2, ClientGame2}] = mockGame(3);
    const gameId = ParseGame(`
phase: 0
deck: 50 camo
`);
    const {selectGame, selectPlayer, selectAnimal, selectTrait} = makeGameSelectors(serverStore.getState, gameId);
    const {deployAnimal} = makeGameActionHelpers(serverStore.getState, gameId);

    expect(ServerGame().getIn(['status', 'turn'])).equal(0);
    expect(ServerGame().getIn(['status', 'phase'])).equal(PHASE.DEPLOY);
    expect(ServerGame().getIn(['status', 'currentPlayer'])).equal(0);

    clientStore0.dispatch(deployAnimal(User0, 0, 0));
    clientStore1.dispatch(deployAnimal(User1, 0, 0));
    clientStore2.dispatch(deployAnimal(User2, 0, 0));

    clientStore0.dispatch(deployAnimal(User0, 0, 0));
    clientStore1.disconnect(SOCKET_DISCONNECT_NOW);
    clientStore2.dispatch(deployAnimal(User2, 0, 0));

    clientStore0.dispatch(deployAnimal(User0, 0, 0));
    clientStore2.dispatch(deployAnimal(User2, 0, 0));

    expect(ServerGame().getIn(['status', 'turn']), 'turn').equal(0);
    expect(ServerGame().getIn(['status', 'phase']), 'PHASE.DEPLOY').equal(PHASE.DEPLOY);
    expect(ServerGame().getIn(['status', 'currentPlayer']), 'currentPlayer').equal(0);
    expect(ServerGame().getPlayer(User0).continent).size(3);
    expect(ServerGame().getPlayer(User1).continent).size(1);
    expect(ServerGame().getPlayer(User2).continent).size(3);
  });
});