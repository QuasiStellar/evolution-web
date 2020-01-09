import {Record} from 'immutable';
import * as plantTraitsData from './plantarium/plantTraitsData'
import {CARD_TARGET_TYPE, CTT_PARAMETER} from './constants';
import TraitDataModelBaseProps from "./TraitDataModelBaseProps";
import ERRORS from '../../../actions/errors';
import identity from "lodash/identity";

const PlantTraitDataModelProps = {
  ...TraitDataModelBaseProps
  , fruit: false
  , coverSlots: 0
  , _getErrorOfTraitPlacement: () => false
  , _getErrorOfFoodIntake: () => false
  , _getErrorOfUse: () => false
};

/**
 * @class TraitDataModel
 * @property {string} type: null - 'TraitFatTissuue', etc
 * @property {CARD_TARGET_TYPE} [cardTargetType: CARD_TARGET_TYPE.ANIMAL_SELF] - How trait should be deployed
 * @property {TRAIT_TARGET_TYPE} targetType - required for traits with .action property
 * @property {boolean} playerControllable: false // if player can click/drag trait
 * @property {array} cooldowns: null - array of cooldown data arrays
 * @property {boolean} multiple: false - is allowed multiple traits with same type? (only for FatTissue)
 * @property {boolean} transient: false - for ambush / anglerfish
 * @property {boolean} hidden: false - for anglerfish
 * @property {callback} action: null // action function
 * (game, sourceAnimal, trait:TraitModel, targetAnimal/targetTrait/none, attackTrait/none, attackAnimal/none) => should return (dispatch, getState)
 * @property {callback} getTargets: null // get list of available target for an active trait (game, sourceAnimal) => list of targets
 * @property {object} customFns: {} // Object of custom trait functions
 *
 * @property {callback} getErrorOfFoodIntake
 * @property {callback} getErrorOfUseAction
 * @property {callback} getErrorOfUseOnTarget
 */

export default class PlantTraitDataModel extends Record(PlantTraitDataModelProps) {
  static new(traitType) {
    if (!(traitType in plantTraitsData)) throw Error(`traitData[${traitType}] not found`);
    const traitData = plantTraitsData[traitType];
    return new PlantTraitDataModel({
      ...traitData
    });
  }

  getErrorOfUse(game, plant, trait, ...targets) {
    if (!trait) trait = plant.hasTrait(this.type, true);
    if (!trait) return ERRORS.TRAIT_ACTION_NO_TRAIT;
    if (trait.disabled) return ERRORS.TRAIT_ACTION_DISABLED;
    console.log('getting error of ', plant.id,  trait.id)
    if (this.cooldowns && this.cooldowns
      .some(([link]) => {
        const res = game.cooldowns.checkFor(link, null, plant.id, trait.id)
        res && console.log('error in', game.cooldowns.toJS())
        res && console.log('error in', link, plant.id, trait.id)
        return res;
      }))
      return ERRORS.COOLDOWN;

    return this._getErrorOfUse(game, plant, trait, ...targets);
  };

  getErrorOfTraitPlacement(game, plant) {
    if (!(this.cardTargetType & CTT_PARAMETER.LINK) && !this.multiple && plant.hasTrait(this.type, true)) return ERRORS.TRAIT_PLACEMENT_MULTIPLE;
    if (this.hidden) return ERRORS.TRAIT_PLACEMENT_HIDDEN;
    return this._getErrorOfTraitPlacement(game, plant);
  }

  getErrorOfFoodIntake(game, plant, animal) {
    return this._getErrorOfFoodIntake(game, plant, animal)
  }
}