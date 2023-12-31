// Sources flattened with hardhat v2.17.0 https://hardhat.org

// File contracts/openzeppelin/utils/Context.sol

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/Context.sol)

pragma solidity ^0.8.19;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}


// File contracts/openzeppelin/access/Ownable.sol

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (access/Ownable.sol)

pragma solidity ^0.8.19;
/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File contracts/openzeppelin/interfaces/draft-IERC6093.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @dev Standard ERC20 Errors
 * Interface of the ERC6093 custom errors for ERC20 tokens
 * as defined in https://eips.ethereum.org/EIPS/eip-6093
 */
interface IERC20Errors {
    /**
     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param balance Current balance for the interacting account.
     * @param needed Minimum amount required to perform a transfer.
     */
    error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC20InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC20InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `spender`’s `allowance`. Used in transfers.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     * @param allowance Amount of tokens a `spender` is allowed to operate with.
     * @param needed Minimum amount required to perform a transfer.
     */
    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC20InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `spender` to be approved. Used in approvals.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC20InvalidSpender(address spender);
}

/**
 * @dev Standard ERC721 Errors
 * Interface of the ERC6093 custom errors for ERC721 tokens
 * as defined in https://eips.ethereum.org/EIPS/eip-6093
 */
interface IERC721Errors {
    /**
     * @dev Indicates that an address can't be an owner. For example, `address(0)` is a forbidden owner in EIP-20.
     * Used in balance queries.
     * @param owner Address of the current owner of a token.
     */
    error ERC721InvalidOwner(address owner);

    /**
     * @dev Indicates a `tokenId` whose `owner` is the zero address.
     * @param tokenId Identifier number of a token.
     */
    error ERC721NonexistentToken(uint256 tokenId);

    /**
     * @dev Indicates an error related to the ownership over a particular token. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param tokenId Identifier number of a token.
     * @param owner Address of the current owner of a token.
     */
    error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC721InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC721InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `operator`’s approval. Used in transfers.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     * @param tokenId Identifier number of a token.
     */
    error ERC721InsufficientApproval(address operator, uint256 tokenId);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC721InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC721InvalidOperator(address operator);
}

/**
 * @dev Standard ERC1155 Errors
 * Interface of the ERC6093 custom errors for ERC1155 tokens
 * as defined in https://eips.ethereum.org/EIPS/eip-6093
 */
interface IERC1155Errors {
    /**
     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param balance Current balance for the interacting account.
     * @param needed Minimum amount required to perform a transfer.
     */
    error ERC1155InsufficientBalance(address sender, uint256 balance, uint256 needed, uint256 tokenId);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC1155InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC1155InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `operator`’s approval. Used in transfers.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     * @param owner Address of the current owner of a token.
     */
    error ERC1155MissingApprovalForAll(address operator, address owner);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC1155InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC1155InvalidOperator(address operator);

    /**
     * @dev Indicates an array length mismatch between ids and values in a safeBatchTransferFrom operation.
     * Used in batch transfers.
     * @param idsLength Length of the array of token identifiers
     * @param valuesLength Length of the array of token amounts
     */
    error ERC1155InvalidArrayLength(uint256 idsLength, uint256 valuesLength);
}


// File contracts/openzeppelin/token/ERC20/IERC20.sol

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (token/ERC20/IERC20.sol)

pragma solidity ^0.8.19;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `from` to `to` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}


// File contracts/openzeppelin/token/ERC20/extensions/IERC20Metadata.sol

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (token/ERC20/extensions/IERC20Metadata.sol)

pragma solidity ^0.8.19;

/**
 * @dev Interface for the optional metadata functions from the ERC20 standard.
 *
 * _Available since v4.1._
 */
interface IERC20Metadata is IERC20 {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);
}


// File contracts/openzeppelin/token/ERC20/ERC20.sol

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (token/ERC20/ERC20.sol)

pragma solidity ^0.8.19;




/**
 * @dev Implementation of the {IERC20} interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using {_mint}.
 *
 * TIP: For a detailed writeup see our guide
 * https://forum.openzeppelin.com/t/how-to-implement-erc20-supply-mechanisms/226[How
 * to implement supply mechanisms].
 *
 * The default value of {decimals} is 18. To change this, you should override
 * this function so it returns a different value.
 *
 * We have followed general OpenZeppelin Contracts guidelines: functions revert
 * instead returning `false` on failure. This behavior is nonetheless
 * conventional and does not conflict with the expectations of ERC20
 * applications.
 *
 * Additionally, an {Approval} event is emitted on calls to {transferFrom}.
 * This allows applications to reconstruct the allowance for all accounts just
 * by listening to said events. Other implementations of the EIP may not emit
 * these events, as it isn't required by the specification.
 *
 * Finally, the non-standard {decreaseAllowance} and {increaseAllowance}
 * functions have been added to mitigate the well-known issues around setting
 * allowances. See {IERC20-approve}.
 */
abstract contract ERC20 is Context, IERC20, IERC20Metadata, IERC20Errors {
    mapping(address => uint256) private _balances;

    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;

    /**
     * @dev Indicates a failed `decreaseAllowance` request.
     */
    error ERC20FailedDecreaseAllowance(address spender, uint256 currentAllowance, uint256 requestedDecrease);

    /**
     * @dev Sets the values for {name} and {symbol}.
     *
     * All two of these values are immutable: they can only be set once during
     * construction.
     */
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the default value returned by this function, unless
     * it's overridden.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view virtual returns (uint8) {
        return 18;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(address account) public view virtual returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address to, uint256 amount) public virtual returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        return true;
    }

    /**
     * @dev See {IERC20-allowance}.
     */
    function allowance(address owner, address spender) public view virtual returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * NOTE: If `amount` is the maximum `uint256`, the allowance is not updated on
     * `transferFrom`. This is semantically equivalent to an infinite approval.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 amount) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, amount);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20}.
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `amount`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `amount`.
     */
    function transferFrom(address from, address to, uint256 amount) public virtual returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

    /**
     * @dev Atomically increases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, allowance(owner, spender) + addedValue);
        return true;
    }

    /**
     * @dev Atomically decreases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `spender` must have allowance for the caller of at least
     * `requestedDecrease`.
     */
    function decreaseAllowance(address spender, uint256 requestedDecrease) public virtual returns (bool) {
        address owner = _msgSender();
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance < requestedDecrease) {
            revert ERC20FailedDecreaseAllowance(spender, currentAllowance, requestedDecrease);
        }
        unchecked {
            _approve(owner, spender, currentAllowance - requestedDecrease);
        }

        return true;
    }

    /**
     * @dev Moves `amount` of tokens from `from` to `to`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _transfer(address from, address to, uint256 amount) internal {
        if (from == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(from, to, amount);
    }

    /**
     * @dev Transfers `amount` of tokens from `from` to `to`, or alternatively mints (or burns) if `from` (or `to`) is
     * the zero address. All customizations to transfers, mints, and burns should be done by overriding this function.
     *
     * Emits a {Transfer} event.
     */
    function _update(address from, address to, uint256 amount) internal virtual {
        if (from == address(0)) {
            _totalSupply += amount;
        } else {
            uint256 fromBalance = _balances[from];
            if (fromBalance < amount) {
                revert ERC20InsufficientBalance(from, fromBalance, amount);
            }
            unchecked {
                // Overflow not possible: amount <= fromBalance <= totalSupply.
                _balances[from] = fromBalance - amount;
            }
        }

        if (to == address(0)) {
            unchecked {
                // Overflow not possible: amount <= totalSupply or amount <= fromBalance <= totalSupply.
                _totalSupply -= amount;
            }
        } else {
            unchecked {
                // Overflow not possible: balance + amount is at most totalSupply, which we know fits into a uint256.
                _balances[to] += amount;
            }
        }

        emit Transfer(from, to, amount);
    }

    /**
     * @dev Creates `amount` tokens and assigns them to `account`, by transferring it from address(0).
     * Relies on the `_update` mechanism
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _mint(address account, uint256 amount) internal {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(address(0), account, amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, by transferring it to address(0).
     * Relies on the `_update` mechanism.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead
     */
    function _burn(address account, uint256 amount) internal {
        if (account == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        _update(account, address(0), amount);
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the `owner` s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
    function _approve(address owner, address spender, uint256 amount) internal virtual {
        _approve(owner, spender, amount, true);
    }

    /**
     * @dev Alternative version of {_approve} with an optional flag that can enable or disable the Approval event.
     *
     * By default (when calling {_approve}) the flag is set to true. On the other hand, approval changes made by
     * `_spendAllowance` during the `transferFrom` operation set the flag to false. This saves gas by not emitting any
     * `Approval` event during `transferFrom` operations.
     *
     * Anyone who wishes to continue emitting `Approval` events on the`transferFrom` operation can force the flag to true
     * using the following override:
     * ```
     * function _approve(address owner, address spender, uint256 amount, bool) internal virtual override {
     *     super._approve(owner, spender, amount, true);
     * }
     * ```
     *
     * Requirements are the same as {_approve}.
     */
    function _approve(address owner, address spender, uint256 amount, bool emitEvent) internal virtual {
        if (owner == address(0)) {
            revert ERC20InvalidApprover(address(0));
        }
        if (spender == address(0)) {
            revert ERC20InvalidSpender(address(0));
        }
        _allowances[owner][spender] = amount;
        if (emitEvent) {
            emit Approval(owner, spender, amount);
        }
    }

    /**
     * @dev Updates `owner` s allowance for `spender` based on spent `amount`.
     *
     * Does not update the allowance amount in case of infinite allowance.
     * Revert if not enough allowance is available.
     *
     * Might emit an {Approval} event.
     */
    function _spendAllowance(address owner, address spender, uint256 amount) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            if (currentAllowance < amount) {
                revert ERC20InsufficientAllowance(spender, currentAllowance, amount);
            }
            unchecked {
                _approve(owner, spender, currentAllowance - amount, false);
            }
        }
    }
}


// File contracts/ForceToken.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
contract ForceToken is ERC20, Ownable {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) Ownable(_msgSender()) {}

    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }
}


// File contracts/DEXAdapterHandlerUtils/DEXAdapterInterface.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface DEXAdapterInterface {
    function getUniswapRouter() external view returns (address);

    function swap(uint256 amountIn, address sendTo, address wTLOS, address forceToken) external returns (uint256);
}


// File contracts/ForceTokenSaleUtils/DEXAdapterHandler.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
abstract contract DEXAdapterHandler is Ownable {
    DEXAdapterInterface private dexAdapter;

    constructor(address _dexAdapter) {
        setDexAdapter(_dexAdapter);
    }

    /**
     * @dev Returns the address of the DEXAdapter contract.
     */
    function getDexAdapter() public view returns (address) {
        return address(dexAdapter);
    }

    /**
     * @dev Allows the owner to set the DEXAdapter contract.
     */
    function setDexAdapter(address _dexAdapter) public onlyOwner {
        require(_dexAdapter != address(0), "DEXAdapterHandler: _dexAdapter is the zero address");

        dexAdapter = DEXAdapterInterface(_dexAdapter);
    }

    /**
     * @dev Sends the given amount of wTLOS to the DEXAdapter contract and swaps it for FORCE tokens.
     * Must have transferred the given amount of wTLOS to this contract before calling this function.
     *
     * @param amountIn The amount of wTLOS to swap.
     * @param sendTo The address to send the FORCE tokens to.
     * @param wTLOS The address of the wTLOS token.
     * @param forceToken The address of the FORCE token.
     * @return {uint256} amount of FORCE tokens received.
     */
    function swap(uint256 amountIn, address sendTo, address wTLOS, address forceToken) internal returns (uint256) {
        IERC20(wTLOS).transfer(address(dexAdapter), amountIn);

        return dexAdapter.swap(amountIn, sendTo, wTLOS, forceToken);
    }
}


// File contracts/ForceTokenSaleUtils/StoringDepositOptions.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

abstract contract StoringDepositOptions {
    struct Option {
        uint256 lockPeriod;
        uint256 numOfPurchases;
        uint256 rewardBonusInTenthPerc;
    }

    Option[] private options;

    constructor(Option[] memory _options) {
        for (uint256 i = 0; i < _options.length; i++) {
            options.push(_options[i]);
        }
    }

    modifier validOption(uint256 _option) {
        require(_option < options.length, "Invalid option");
        _;
    }

    /**
     * @dev Returns the option at the given index.
     */
    function getOption(uint256 index) public view validOption(index) returns (uint256, uint256, uint256) {
        Option memory _option = options[index];

        return (_option.lockPeriod, _option.numOfPurchases, _option.rewardBonusInTenthPerc);
    }

    /**
     * @dev Returns all options.
     */
    function getOptions() public view returns (Option[] memory) {
        return options;
    }
}


// File contracts/ForceTokenSaleUtils/TimeHandler.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

abstract contract TimeHandler {
    function time() internal view virtual returns (uint256) {
        return block.timestamp;
    }
}


// File contracts/libraries/Math.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library Math {
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? b : a;
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Rounds up.
     */
    function divideRoundUp(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 result = a / b;
        if (a % b != 0) {
            result += 1;
        }
        return result;
    }
}


// File contracts/ForceTokenSaleUtils/RecordingDeposits.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
abstract contract RecordingDeposits is StoringDepositOptions, TimeHandler {
    struct Deposit {
        uint256 option;
        uint256 amountDeposited;
        uint256 depositedAt;
        uint256 purchasesMade;
        address depositor;
    }

    Deposit[] private deposits;
    mapping(address => uint256[]) private userDeposits;

    function addDeposit(
        uint256 option,
        uint256 amount,
        uint256 depositedAt,
        address user
    ) internal validOption(option) returns (Deposit storage) {
        require(amount > 0, "Amount must be greater than 0");

        userDeposits[user].push(deposits.length);
        deposits.push(
            Deposit({
                option: option,
                amountDeposited: amount,
                depositedAt: depositedAt,
                purchasesMade: 0,
                depositor: user
            })
        );

        return deposits[deposits.length - 1];
    }

    function _getDeposit(uint256 index) internal view returns (Deposit storage) {
        return deposits[index];
    }

    /**
     * @dev Returns the deposit at the given index.
     */
    function getDeposit(uint256 index) public view returns (Deposit memory) {
        return deposits[index];
    }

    function getAvailablePurchasesFromDeposit(
        Deposit memory userDeposit,
        uint256 currentTime
    ) private view returns (uint256) {
        (uint256 lockPeriod, uint256 numOfPurchases, ) = getOption(userDeposit.option);
        uint256 endTime = Math.min(userDeposit.depositedAt + lockPeriod, currentTime);
        uint256 timePassed = endTime - userDeposit.depositedAt;

        return Math.divideRoundUp((timePassed * numOfPurchases), lockPeriod) - userDeposit.purchasesMade;
    }

    function incrementPurchasesMade(Deposit storage userDeposit, uint256 amount) internal {
        (, uint256 numOfPurchases, ) = getOption(userDeposit.option);

        userDeposit.purchasesMade += amount;

        require(userDeposit.purchasesMade <= numOfPurchases, "All numOfPurchases already distributed");
    }

    /**
     * @dev Returns all deposits.
     */
    function getAllDeposits() public view returns (Deposit[] memory) {
        return deposits;
    }

    /**
     * @dev Returns all deposits made by the given user.
     * @param user The address of the user.
     */
    function getAllUserDeposits(address user) public view returns (Deposit[] memory) {
        uint256[] storage userDepositIndexes = userDeposits[user];
        Deposit[] memory userDepositsArray = new Deposit[](userDepositIndexes.length);

        for (uint256 i = 0; i < userDepositIndexes.length; i++) {
            userDepositsArray[i] = deposits[userDepositIndexes[i]];
        }

        return userDepositsArray;
    }

    function _getAllDepositsAndAvailablePurchases() internal view returns (Deposit[] storage, uint256[] memory) {
        uint256[] memory availablePurchases = new uint256[](deposits.length);

        uint256 currentTime = time();

        for (uint256 i = 0; i < deposits.length; i++) {
            availablePurchases[i] = getAvailablePurchasesFromDeposit(deposits[i], currentTime);
        }

        return (deposits, availablePurchases);
    }

    /**
     * @dev Returns all deposits and the calculated available purchases from each deposit.
     */
    function getAllDepositsAndAvailablePurchases() public view returns (Deposit[] memory, uint256[] memory) {
        return _getAllDepositsAndAvailablePurchases();
    }
}


// File contracts/ForceTokenSale.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
contract ForceTokenSale is DEXAdapterHandler, RecordingDeposits {
    ERC20 private wTLOS;
    ForceToken private forceToken;

    constructor(
        address _dexAdapter,
        address _wTLOS,
        address _forceToken,
        Option[] memory _options
    ) DEXAdapterHandler(_dexAdapter) StoringDepositOptions(_options) Ownable(_msgSender()) {
        require(_wTLOS != address(0), "ForceTokenSale: _wTLOS is the zero address");
        require(_forceToken != address(0), "ForceTokenSale: _forceToken is the zero address");

        wTLOS = ERC20(_wTLOS);
        forceToken = ForceToken(_forceToken);
    }

    /**
     * @dev Allows users to deposit wTLOS tokens and select a DCAR option to purchase.
     * Must have approved this contract to spend the given amount of wTLOS before calling this function.
     * On deposit, a single purchase is made.
     */
    function deposit(uint256 amount, uint256 optionIndex) public {
        require(amount > 0, "ForceTokenSale: amount must be greater than zero");

        address sender = _msgSender();
        Deposit storage _deposit = addDeposit(optionIndex, amount, time(), sender);

        wTLOS.transferFrom(sender, address(this), amount);
        makePurchasesFromDeposit(_deposit, 1);
    }

    /**
     * Function used in `completeAllOutstandingPurchases()` to make purchases from a deposit.
     * Calculates the amount of wTLOS to be spent per each purchase, swaps it for FORCE tokens,
     * and sends the FORCE tokens to the depositor.
     * Also sends the reward bonus to the depositor from the contract's FORCE token balance.
     */
    function makePurchasesFromDeposit(Deposit storage _deposit, uint256 purchasesToAdd) private {
        if (purchasesToAdd == 0) return;

        (, uint256 numOfPurchases, uint256 rewardBonusInTenthPerc) = getOption(_deposit.option);
        uint256 amount = (_deposit.amountDeposited * purchasesToAdd) / numOfPurchases;

        uint256 amountOfForceTokensReceived = swap(amount, _deposit.depositor, address(wTLOS), address(forceToken));
        uint256 rewardBonus = (amountOfForceTokensReceived * rewardBonusInTenthPerc) / 1000;

        require(forceToken.balanceOf(address(this)) >= rewardBonus, "ForceTokenSale: insufficient reward bonus");
        forceToken.transfer(_deposit.depositor, rewardBonus);

        incrementPurchasesMade(_deposit, purchasesToAdd);
    }

    /**
     * @dev Allows the owner to go through all deposits, calculate available purchases, and make purchases.
     * This function should be called regularly whenever there are purchases available.
     */
    function completeAllOutstandingPurchases() public onlyOwner {
        (Deposit[] storage _deposits, uint256[] memory availablePurchases) = _getAllDepositsAndAvailablePurchases();

        for (uint256 i = 0; i < _deposits.length; i++) {
            makePurchasesFromDeposit(_deposits[i], availablePurchases[i]);
        }
    }
}
